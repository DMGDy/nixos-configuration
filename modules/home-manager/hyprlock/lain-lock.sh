# Text frames for the Copland OS (Serial Experiments Lain) lock screen.
# hyprlock re-runs each label's command every ~100 ms; every frame is a pure
# function of the time since hyprlock started, so all labels stay in step.
# Usage: lain-lock.sh <mode> [assets-dir]. LAIN_T=<ms> overrides the time
# for previews. Hot paths stay in bash
# builtins: this runs dozens of times a second while locked.

mode=${1:-boot}
assets=${2:-}
cache="${XDG_RUNTIME_DIR:-/tmp}/lain-lock"
[ -d "$cache" ] || mkdir -p "$cache"

elapsed_ms() {
  local up pid start comm st
  if [ -n "${LAIN_T:-}" ]; then t=$LAIN_T; return; fi
  read -r up _ </proc/uptime                # seconds with 2 decimals
  [ -r "$cache/start" ] && read -r pid start <"$cache/start"
  comm=
  [ -n "$pid" ] && [ -r "/proc/$pid/comm" ] && read -r comm <"/proc/$pid/comm"
  if [ "$comm" != hyprlock ]; then
    pid=$(pidof -s hyprlock) || { t=999999999; return; }
    read -r -a st <"/proc/$pid/stat"
    start=${st[21]}                         # clock ticks (100/s) since boot
    echo "$pid $start" >"$cache/start"
  fi
  t=$(( (10#${up/./} - start) * 10 ))
}

elapsed_ms
if (( (t / 530) % 2 == 0 )); then cursor="█"; else cursor=" "; fi

# System facts for the boot log, gathered once per boot of the machine.
facts="$cache/facts"
if [ ! -s "$facts" ]; then
  {
    cat /proc/sys/kernel/hostname
    awk '/MemTotal/ { printf "%dM\n", $2 / 1024 }' /proc/meminfo
    sed -n 's/^model name\s*: //p' /proc/cpuinfo | head -1 | sed 's/ [0-9]*-Core Processor//; s/(R)//g; s/(TM)//g; s/^AMD //; s/^Intel //'
    { nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null || echo INTEGRATED; } | head -1 | sed 's/NVIDIA GeForce //'
    uname -r
  } >"$facts"
fi
mapfile -t f <"$facts"

log=
line() { log+="$1"$'\n'; }
dots() { # label, value: pad with dots to a fixed column
  local pad
  printf -v pad '%*s' $(( 20 - ${#1} )) ''
  line "$1 ${pad// /.} $2"
}

glitch() { # corrupt a few characters of $1, roughly once a second
  local s=$1 out i c pool='▓▒░█#%@/_'       # no < > &: labels are Pango markup
  out=$s
  if (( RANDOM % 11 == 0 )); then
    for _ in 1 2 3; do
      i=$(( RANDOM % ${#s} )); c=${pool:RANDOM % ${#pool}:1}
      [ "${s:i:1}" = " " ] || out="${out:0:i}${c}${out:i+1}"
    done
  fi
  printf '%s' "$out"
}

case "$mode" in
  boot)
    line "COPLAND OS ENTERPRISE  ver. 2.6"
    line "(c) TACHIBANA GENERAL LABORATORIES"
    line ""
    dots "MEMORY CHECK" "${f[1]} OK"
    dots "NAVI" "${f[0]}"
    dots "PROCESSOR" "${f[2]}"
    dots "GRAPHICS" "${f[3]}"
    dots "KERNEL" "${f[4]}"
    dots "PROTOCOL 7" "LOADED"
    dots "WIRED LINK" "ESTABLISHED"
    line ""
    log+="user $USER :: session locked"
    shown=$(( t / 14 ))                     # ~70 characters per second
    if (( shown < ${#log} )); then
      printf '%s%s' "${log:0:shown}" "$cursor"
    else
      printf '%s' "$log"
    fi
    ;;
  fallback)                                 # text logo when the show's frame is missing
    [ -r "$assets/frame0.jpg" ] && exit 0
    printf '<b><i>Copland OS Enterprise</i></b>\n<span size="45%%"><b><i>Produced By Tachibana Lab</i></b></span>'
    ;;
  clock)
    printf -v day '%(%Y.%m.%d)T' -1
    printf -v now '%(%H:%M:%S)T' -1
    frac=${EPOCHREALTIME#*.}
    printf '<b><i>Present day   %s\nPresent time  %s.%s</i></b>' "$day" "$now" "${frac:0:1}"
    ;;
  tagline)
    (( t < 3200 )) && exit 0
    msg="Close the world, Open the nExt"
    if (( RANDOM % 23 == 0 )); then        # the occasional mirrored frame
      rev=; for (( i = ${#msg} - 1; i >= 0; i-- )); do rev+=${msg:i:1}; done
      msg=$rev
    else
      msg=$(glitch "$msg")
    fi
    printf '<b><i>%s</i></b>%s' "$msg" "$cursor"
    ;;
  wired)
    if (( (t / 650) % 2 == 0 )); then dot="●"; else dot="○"; fi
    printf '%s  WIRED :: ONLINE\nPROTOCOL 7' "$dot"
    ;;
  laugh)                                    # two seconds of laughter every 29
    phase=$(( (t / 1000) % 29 ))
    (( phase >= 12 && phase < 14 )) && printf 'h a h a h a h a'
    ;;
esac
exit 0
