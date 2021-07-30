( Sound device status bits: )
constant sound-status-disable 0
constant sound-status-enabled 1
constant sound-status-playing 2
constant sound-status-demo 4
constant sound-status-error 128

( Default device address and IRQ: )
constant sound-irq 21
constant sound-addr 4026585088

def sound-device
  sound-irq sound-addr return2
end

( Device registers: )

def sound-dev-status
  arg0 return1
end

def sound-dev-gain
  arg0 int32 1 int-add return1
end

def sound-dev-time
  arg0 int32 2 int-add return1
end

def sound-dev-num-channels
  arg0 int32 30 int-add return1
end

def sound-dev-sampler
  arg0 int32 6 int-add return1
end

( Sample loader: )

def sound-sampler-id
  arg0 int32 0 int-add return1
end

def sound-sampler-address
  arg0 int32 4 int-add return1
end

def sound-sampler-length
  arg0 int32 8 int-add return1
end

def sound-sampler-format
  arg0 int32 12 int-add return1
end

def sound-sampler-num-channels
  arg0 int32 16 int-add return1
end

def sound-sampler-byte-rate
  arg0 int32 20 int-add return1
end

( Channels: )

def sound-dev-channels
  arg0 int32 34 int-add return1
end

constant sound-channel-size 28

def sound-dev-channel ( dev num )
  arg1 sound-dev-channels
  arg0 sound-channel-size int-mul
  int-add return1
end

def sound-channel-mode
  arg0 int32 0 int-add return1
end

def sound-channel-param
  arg0 int32 1 int-add return1
end

def sound-channel-gain
  arg0 int32 2 int-add return1
end

def sound-channel-pan
  arg0 int32 3 int-add return1
end

def sound-channel-rate
  arg0 int32 4 int-add return1
end

def sound-channel-start-at
  arg0 int32 8 int-add return1
end

def sound-channel-stop-at
  arg0 int32 12 int-add return1
end

def sound-channel-loop-start
  arg0 int32 16 int-add return1
end

def sound-channel-loop-end
  arg0 int32 20 int-add return1
end

def sound-channel-data1
  arg0 int32 24 int-add return1
end

( Setters )

def sound-set-gain
  arg1 arg0 sound-dev-gain swapdrop poke-byte
end

( Initialization )

def sound-dev-init ( irq addr )
  sound-status-enabled sound-status-playing logior arg0 poke-byte
  int32 255 arg0 sound-set-gain
end

def sound-sampler-load ( device sample-id format rate addr length )
  int32 5 argn sound-dev-sampler
  sound-sampler-id int32 4 argn swap poke
  sound-sampler-address arg1 swap poke
  sound-sampler-length arg0 swap poke
  sound-sampler-num-channels int32 1 swap poke
  sound-sampler-byte-rate arg2 swap poke
  sound-sampler-format arg3 swap poke
end

def sound-channel-sample ( device channel sample )
  arg2 arg1 sound-dev-channel
  sound-channel-param int32 0 swap poke-byte drop2
  sound-channel-gain int32 255 swap poke-byte drop2
  sound-channel-pan int32 0 swap poke-byte drop2
  sound-channel-rate int32 0 swap poke
  sound-channel-start-at int32 0 swap poke
  sound-channel-stop-at int32 0 swap poke
  sound-channel-loop-start int32 0 swap poke
  sound-channel-loop-end int32 0 swap poke
  sound-channel-data1 arg0 swap poke
  sound-channel-mode int32 7 swap poke-byte drop2
end

def sound-channel-osc ( device channel mode freq )
  arg3 arg2 sound-dev-channel
  sound-channel-param int32 0 swap poke-byte drop2
  sound-channel-gain int32 255 swap poke-byte drop2
  sound-channel-pan int32 0 swap poke-byte drop2
  sound-channel-rate int32 0 swap poke
  sound-channel-start-at int32 0 swap poke
  sound-channel-stop-at int32 0 swap poke
  sound-channel-loop-start int32 0 swap poke
  sound-channel-loop-end int32 0 swap poke
  sound-channel-data1 arg0 swap poke
  sound-channel-mode arg1 swap poke-byte drop2
end

def sound-channel-start ( dev channel when )
  arg2 arg1 sound-dev-channel
  sound-channel-start-at arg0 swap poke
end

def sound-channel-stop ( dev channel when )
  arg2 arg1 sound-dev-channel
  sound-channel-stop-at arg0 swap poke
end

def sound-channel-play ( dev-addr channel start duration )
  arg3 arg2 arg1 sound-channel-start
  arg0 int-add
  sound-channel-stop
end

def set-sound-channel-loop-start ( dev channel when )
  arg2 arg1 sound-dev-channel
  sound-channel-loop-start arg0 swap poke
end

def set-sound-channel-loop-end ( dev channel when )
  arg2 arg1 sound-dev-channel
  sound-channel-loop-end arg0 swap poke
end

def sound-channel-loop ( dev channel start end )
  arg3 arg2 arg1 set-sound-channel-loop-start drop
  arg0 set-sound-channel-loop-end
end

( Test functions )

def sound-demo
  arg0 sound-dev-status peek sound-status-demo logior arg0 poke-byte
end

constant beep-channel 0
constant beep-frequency 1728
constant beep-mode 1
constant beep-duration 250

def tone-init ( freq )
  sound-addr beep-channel beep-mode arg0 sound-channel-osc
end

def tone-play ( duration )
  sound-addr beep-channel beep-mode arg0 sound-channel-play
end

def tone ( duration freq )
  arg0 tone-init
  arg1 tone-play
end

global-var *beep-initialized*

( Initialize the beep channel to beep. )
def beep-init
  beep-frequency tone-init
  int32 1 *beep-initialized* poke
end

( Plays the beep for the beep-duration. The channel is initialized if *beep-initialized* is zero. )
def beep
  *beep-initialized* peek UNLESS beep-init THEN
  beep-duration tone-play
end

constant boot-sound-base-note 216
constant boot-sound-note-step 32
constant boot-sound-channel-delay 125
constant boot-sound-note-length 250

def boot-sound-channel-freq ( channel )
  arg0 boot-sound-note-step int-mul
  boot-sound-base-note int-add
  return1
end

def boot-sound-n ( dev-addr channel n )
  arg2 arg1 int32 1
  arg0 boot-sound-channel-freq swapdrop
  sound-channel-osc drop2
  arg0 boot-sound-channel-delay int-mul
  int32 1 int-add
  boot-sound-note-length
  sound-channel-play
end

def boot-sound/2 ( device-addr num-channels )
  arg0 int32 1 int-sub dup UNLESS return0 THEN
  set-arg0
  arg1 arg0 arg0 boot-sound-n drop2
  RECURSE
end

def boot-static/2 ( device channel )
  ( calculate loop length in ms )
  int32 11025 int32 100000 int-mul int32 1000 int-mul
  ( load sample )
  arg1 int32 1 int32 2 int32 11025 int32 0 int32 100000 sound-sampler-load
  ( setup channel )
  arg1 arg0 int32 1 sound-channel-sample
  arg1 arg0 int32 0 local0 sound-channel-loop
  ( start channel )
  arg1 arg0 int32 1 sound-channel-start
end

def boot-sound/1 ( device )
  arg0 sound-dev-num-channels swapdrop peek
  ( one channel to play the code segment as static )
  ( brings Firefox to a crawl when copying the sample from RAM to sound device )
  ( arg0 local0 int32 1 int-sub boot-static/2 )
  ( all other channels oscillate )
  arg0 local0 int32 2 int-sub boot-sound/2
  ( stop static )
  arg0 local0 int32 1 int-sub int32 10000 sound-channel-stop
end

def boot-sound
  sound-addr boot-sound/1
end

def sound-init-always
  sound-device sound-dev-init
  int32 0 *beep-initialized* poke
end

def sound-init
  *beep-initialized* peek dup
  IF beep THEN
  UNLESS sound-init-always boot-sound beep-init THEN
end
