OUT_DIR="/data/adb/modules/ZRAM-Module/webroot"
OUT_FILE="$OUT_DIR/status.json"
TMP_FILE="$OUT_DIR/status.json.tmp"

mkdir -p "$OUT_DIR"

algo_raw=$(cat /sys/block/zram0/comp_algorithm 2>/dev/null)
algorithm=$(echo "$algo_raw" | grep -o '\[[^]]*\]' | tr -d '[]')

swaps_line=$(grep zram0 /proc/swaps)

# /proc/swaps 单位为 KB，直接除以 1024 换算为 MB
size_kb=$(echo "$swaps_line" | awk '{print $3}')
used_kb=$(echo "$swaps_line" | awk '{print $4}')

size_mb=$(echo "$size_kb / 1024" | bc)
used_mb=$(echo "$used_kb / 1024" | bc)

if [ -n "$used_mb" ] && [ "$used_mb" -gt 0 ] 2>/dev/null; then
  ratio=$(echo "scale=2; $size_mb / $used_mb" | bc)
else
  ratio="N/A"
fi

cat <<EOF > "$TMP_FILE"
{
  "algorithm": "${algorithm:-未知}",
  "size": "${size_mb:-0}",
  "used": "${used_mb:-0}",
  "ratio": "${ratio} : 1"
}
EOF

mv -f "$TMP_FILE" "$OUT_FILE"
