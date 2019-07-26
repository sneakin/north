%defstr BITS_STR BITS
%defstr PLATFORM_STR PLATFORM
%strcat OPCODES_PATH "north/",PLATFORM_STR,"-",BITS_STR,"/opcodes.h"
%include OPCODES_PATH
