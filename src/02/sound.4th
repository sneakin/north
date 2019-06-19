constant sound-status-disable 0
constant sound-status-enabled 1
constant sound-status-playing 2
constant sound-status-demo 4
constant sound-status-error 128

constant sound-irq 21
constant sound-addr 4026585088

: sound-device
  sound-irq sound-addr return2
;

( Device registers )

: sound-dev-status
  arg0 return1
;

: sound-dev-gain
  arg0 int32 1 int-add return1
;

: sound-dev-time
  arg0 int32 2 int-add return1
;

: sound-dev-num-channels
  arg0 int32 30 int-add return1
;

: sound-dev-sampler
  arg0 int32 6 int-add return1
;

( Sample loader: )

: sound-sampler-id
  arg0 int32 0 int-add return1
;

: sound-sampler-address
  arg0 int32 4 int-add return1
;

: sound-sampler-length
  arg0 int32 8 int-add return1
;

: sound-sampler-format
  arg0 int32 12 int-add return1
;

: sound-sampler-num-channels
  arg0 int32 16 int-add return1
;

: sound-sampler-byte-rate
  arg0 int32 20 int-add return1
;

( Channels: )

: sound-dev-channels
  arg0 int32 34 int-add return1
;

constant sound-channel-size 28

: sound-dev-channel ( dev num )
  arg1 sound-dev-channels
  arg0 sound-channel-size int-mul
  int-add return1
;

: sound-channel-mode
  arg0 int32 0 int-add return1
;

: sound-channel-param
  arg0 int32 1 int-add return1
;

: sound-channel-gain
  arg0 int32 2 int-add return1
;

: sound-channel-pan
  arg0 int32 3 int-add return1
;

: sound-channel-rate
  arg0 int32 4 int-add return1
;

: sound-channel-start-at
  arg0 int32 8 int-add return1
;

: sound-channel-stop-at
  arg0 int32 12 int-add return1
;

: sound-channel-loop-start
  arg0 int32 16 int-add return1
;

: sound-channel-loop-end
  arg0 int32 20 int-add return1
;

: sound-channel-data1
  arg0 int32 24 int-add return1
;

( Setters )

: sound-set-gain
  arg1 arg0 sound-dev-gain swapdrop poke-byte
;

( Initialization )

: sound-dev-init ( irq addr )
  sound-status-enabled sound-status-playing logior arg0 poke-byte
  int32 255 arg0 sound-set-gain
;

: sound-sampler-load ( device sample-id format rate addr length )
  int32 5 argn sound-dev-sampler
  sound-sampler-id int32 4 argn swap poke
  sound-sampler-address arg1 swap poke
  sound-sampler-length arg0 swap poke
  sound-sampler-num-channels int32 1 swap poke
  sound-sampler-byte-rate arg2 swap poke
  sound-sampler-format arg3 swap poke
;

: sound-channel-sample ( device channel sample )
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
;

: sound-channel-osc ( device channel mode freq )
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
;

: sound-channel-start ( dev channel when )
  arg2 arg1 sound-dev-channel
  sound-channel-start-at arg0 swap poke
;

: sound-channel-stop ( dev channel when )
  arg2 arg1 sound-dev-channel
  sound-channel-stop-at arg0 swap poke
;

: sound-channel-play ( dev-addr channel start duration )
  arg3 arg2 arg1 sound-channel-start
  arg0 int-add
  sound-channel-stop
;

: set-sound-channel-loop-start ( dev channel when )
  arg2 arg1 sound-dev-channel
  sound-channel-loop-start arg0 swap poke
;

: set-sound-channel-loop-end ( dev channel when )
  arg2 arg1 sound-dev-channel
  sound-channel-loop-end arg0 swap poke
;

: sound-channel-loop ( dev channel start end )
  arg3 arg2 arg1 set-sound-channel-loop-start drop
  arg0 set-sound-channel-loop-end
;

( Test functions )

: sound-demo
  arg0 sound-dev-status peek sound-status-demo logior arg0 poke-byte
;

constant beep-channel 0
constant beep-frequency 1728
constant beep-mode 1
constant beep-duration 250

: tone-init ( freq )
  sound-addr beep-channel beep-mode arg0 sound-channel-osc
;

: tone-play ( duration )
  sound-addr beep-channel beep-mode arg0 sound-channel-play
;

: tone ( duration freq )
  arg0 tone-init
  arg1 tone-play
;

( set channel to oscillate for half a second )
global-var *beep-initialized* 0

: beep-init
  beep-frequency tone-init
  int32 1 *beep-initialized* poke
;

: beep
  *beep-initialized* peek UNLESS beep-init THEN
  beep-duration tone-play
;

constant boot-sound-base-note 216
constant boot-sound-note-step 32
constant boot-sound-channel-delay 125
constant boot-sound-note-length 250

: boot-sound-channel-freq ( channel )
  arg0 boot-sound-note-step int-mul
  boot-sound-base-note int-add
  return1
;

: boot-sound-n ( dev-addr channel n )
  arg2 arg1 int32 1
  arg0 boot-sound-channel-freq swapdrop
  sound-channel-osc drop2
  arg0 boot-sound-channel-delay int-mul
  int32 1 int-add
  boot-sound-note-length
  sound-channel-play
;

: boot-sound/2 ( device-addr num-channels )
  arg0 int32 1 int-sub dup UNLESS return0 THEN
  set-arg0
  arg1 arg0 arg0 boot-sound-n drop2
  RECURSE
;

: boot-static/1 ( device channel )
  ( calculate loop length in ms )
  int32 11025 int32 100000 int-mul int32 1000 int-mul
  ( load sample )
  arg1 int32 1 int32 2 int32 11025 int32 0 int32 100000 sound-sampler-load
  ( setup channel )
  arg1 arg0 int32 1 sound-channel-sample
  arg1 arg0 int32 0 local0 sound-channel-loop
  ( start channel )
  arg1 arg0 int32 1 sound-channel-start
;

: boot-sound/1 ( device )
  arg0 sound-dev-num-channels swapdrop peek
  ( todo one channel to play the code segment )
  arg0 local0 int32 1 int-sub boot-static/1
  ( all other channels oscillate )
  arg0 local0 int32 2 int-sub boot-sound/2
  ( stop static )
  arg0 local0 int32 1 int-sub int32 10000 sound-channel-stop
;

: boot-sound/0
  sound-addr boot-sound/1
  beep-init
;

: sound-init
  sound-device sound-dev-init
;
