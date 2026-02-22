param(
  [string]$ImageName = "campusbite:latest"
)

docker build -t $ImageName -f Dockerfile .
