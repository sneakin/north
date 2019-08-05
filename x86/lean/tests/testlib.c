#if(PLATFORM == windows)
#define EXPORT __declspec(dllexport)
#else
#define EXPORT
#endif

EXPORT int fun4(int a, int b, int x, int y)
{
  int xa = (x - a);
  int xb = (y - b);
  return xa*xa + xb*xb;
}
