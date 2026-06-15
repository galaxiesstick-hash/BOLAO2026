#!/bin/bash
CSRF=$(curl -sk https://bolao.bubhug.com/api/auth/csrf | python3 -c "import sys,json; print(json.load(sys.stdin)[chr(99)+chr(115)+chr(114)+chr(102)+chr(84)+chr(111)+chr(107)+chr(101)+chr(110)])")
echo CSRF_OK
curl -sk -c /tmp/c.txt -b /tmp/c.txt   -X POST https://bolao.bubhug.com/api/auth/callback/credentials   -H "Content-Type: application/x-www-form-urlencoded"   -d "email=vippsilva.smart%40gmail.com&password=1q2w3e4r&csrfToken=${CSRF}&json=true"   -D - 2>&1 | head -8