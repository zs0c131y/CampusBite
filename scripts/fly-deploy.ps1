param(
  [string]$Config = "fly.toml"
)

fly deploy --config $Config
