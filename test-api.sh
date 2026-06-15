#!/bin/bash
curl -sf -H X-Auth-Token: 0e51bd26c1534857b986308ca5c68851   https://api.football-data.org/v4/competitions/WC/matches?status=SCHEDULED&limit=3   -o /tmp/api-resp.json 2>&1
echo HTTP exit: 0
python3 -c import json; d=json.load(open('/tmp/api-resp.json')); print('count:', d.get('count', 'N/A')); print('first:', d['matches'][0]['homeTeam']['name'],' vs ',d['matches'][0]['awayTeam']['name'], d['matches'][0]['utcDate'][:10] if d.get('matches') else 'none')