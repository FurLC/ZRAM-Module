MODDIR="/data/adb/modules/ZRAM-Module"
CONFIG_FILE="$MODDIR/config.prop"

# 加载配置
if [ -f "$CONFIG_FILE" ]; then
  . "$CONFIG_FILE"
else
  echo "未找到 config.prop，退出" >&2
  exit 1
fi

# 重载 zram
echo "停用当前 zram..."
swapoff /dev/block/zram0

echo "重置 zram 参数..."
if ! echo 1 > /sys/block/zram0/reset; then
  echo "reset 失败，终止" >&2
  exit 1
fi

echo "设置压缩流数..."
echo 8 > /sys/block/zram0/max_comp_streams

echo "设置压缩算法: $ZRAM_ALGO"
echo "$ZRAM_ALGO" > /sys/block/zram0/comp_algorithm

echo "设置 disksize: $ZRAM_SIZE"
if ! echo "$ZRAM_SIZE" > /sys/block/zram0/disksize; then
  echo "disksize 设置失败，终止" >&2
  exit 1
fi

echo "创建 zram 并启用..."
if ! mkswap /dev/block/zram0; then
  echo "mkswap 失败，终止" >&2
  exit 1
fi
swapon /dev/block/zram0

echo "ZRAM 热重载完成。"