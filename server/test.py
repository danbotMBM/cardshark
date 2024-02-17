import collections
import json

a = collections.deque()
for i in range(10):
    a.append(i)

print(str(list(a)))