# Local port-forward through a SOCKS5 proxy.
#
# Listens on 127.0.0.1:<LocalPort> and forwards every connection through the
# Happ/Xray SOCKS proxy to <TargetHost>:<TargetPort>. Point ssh, scp, rsync or
# anything else at the local port and it comes out the other side of the VPN.
#
# This exists because the server is only reachable through the proxy from this
# network, and Windows OpenSSH has no SOCKS support. The obvious alternative —
# a ProxyCommand helper — has to relay SSH's binary stream over the child
# process's stdin/stdout, and PowerShell's console streams are not dependable
# for that: the handshake completes and then the session dies on the first
# encrypted packet. Socket-to-socket has no such problem.
#
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy\socks-forward.ps1
#   ssh -p 2222 root@127.0.0.1
#
# Leave it running in its own window; Ctrl+C stops it.

param(
  [int]$LocalPort = 2222,
  [string]$TargetHost = '2.27.202.93',
  [int]$TargetPort = 22,
  [string]$ProxyHost = '127.0.0.1',
  [int]$ProxyPort = 10808
)

$ErrorActionPreference = 'Stop'

function Connect-Socks5 {
  param([string]$PHost, [int]$PPort, [string]$THost, [int]$TPort)

  $c = New-Object System.Net.Sockets.TcpClient
  $c.Connect($PHost, $PPort)
  $c.NoDelay = $true
  $s = $c.GetStream()

  $s.Write([byte[]]@(5, 1, 0), 0, 3)
  $hello = New-Object byte[] 2
  if ($s.Read($hello, 0, 2) -ne 2 -or $hello[1] -ne 0) {
    $c.Close(); throw "proxy rejected the SOCKS handshake"
  }

  $portBytes = [BitConverter]::GetBytes([uint16]$TPort)
  [array]::Reverse($portBytes)

  $parsed = [System.Net.IPAddress]::Any
  if ([System.Net.IPAddress]::TryParse($THost, [ref]$parsed)) {
    $req = @(5, 1, 0, 1) + $parsed.GetAddressBytes() + $portBytes
  } else {
    # Let the proxy resolve the name at its exit rather than here.
    $n = [System.Text.Encoding]::ASCII.GetBytes($THost)
    $req = @(5, 1, 0, 3, $n.Length) + $n + $portBytes
  }
  $s.Write([byte[]]$req, 0, $req.Length)

  $head = New-Object byte[] 4
  if ($s.Read($head, 0, 4) -lt 4 -or $head[1] -ne 0) {
    $codes = @{ 1='general failure'; 2='not allowed'; 3='network unreachable'
                4='host unreachable'; 5='connection refused'; 6='TTL expired'
                7='command not supported'; 8='address type not supported' }
    $code = [int]$head[1]
    $c.Close(); throw "SOCKS CONNECT failed ($code - $($codes[$code]))"
  }
  # Drain the bound-address tail so the stream starts at real payload.
  switch ([int]$head[3]) {
    1 { $rest = 6 }
    4 { $rest = 18 }
    3 { $l = New-Object byte[] 1; $null = $s.Read($l, 0, 1); $rest = [int]$l[0] + 2 }
    default { $rest = 0 }
  }
  while ($rest -gt 0) {
    $skip = New-Object byte[] $rest
    $got = $s.Read($skip, 0, $rest)
    if ($got -le 0) { break }
    $rest -= $got
  }
  return $c
}

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $LocalPort)
$listener.Start()
Write-Host "socks-forward: 127.0.0.1:$LocalPort  ->  $ProxyHost`:$ProxyPort  ->  $TargetHost`:$TargetPort"
Write-Host "socks-forward: ready (Ctrl+C to stop)"

try {
  while ($true) {
    $local = $listener.AcceptTcpClient()
    $local.NoDelay = $true
    try {
      $remote = Connect-Socks5 -PHost $ProxyHost -PPort $ProxyPort -THost $TargetHost -TPort $TargetPort
    } catch {
      Write-Host "socks-forward: $($_.Exception.Message)"
      $local.Close(); continue
    }

    # Both ends are sockets, so a plain CopyToAsync pair is safe here — a
    # NetworkStream write goes out on the wire rather than into a buffer.
    $ls = $local.GetStream(); $rs = $remote.GetStream()
    $a = $ls.CopyToAsync($rs)
    $b = $rs.CopyToAsync($ls)

    # Close both as soon as either direction ends, so the pair cannot leak.
    $closer = [System.Threading.Tasks.Task]::Run([System.Action]{
      [System.Threading.Tasks.Task]::WaitAny(@($a, $b)) | Out-Null
      try { $local.Close() } catch {}
      try { $remote.Close() } catch {}
    }.GetNewClosure())
    $null = $closer
  }
}
finally {
  $listener.Stop()
}
