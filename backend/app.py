import os, time
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
app=Flask(__name__); CORS(app, resources={r"/api/*":{"origins":"*"}})
API_BASE="https://api.gameskinbo.com"; API_KEY=os.environ.get("FREEFIRE_API_KEY","").strip(); CACHE={}; CACHE_TTL=60
def first_value(*values, default=None):
    for v in values:
        if v is not None and v!="": return v
    return default
def extract_guild(data):
    for obj in [data.get("GuildInfo"),data.get("Guild"),data.get("ClanInfo"),data.get("Clan")]:
        if isinstance(obj,dict):
            v=first_value(obj.get("GuildName"),obj.get("guildName"),obj.get("Name"),obj.get("name"),obj.get("ClanName"),obj.get("clanName"))
            if v:return v
        elif isinstance(obj,str) and obj:return obj
    for k,v in data.items():
        if isinstance(v,dict) and "guild" in k.lower():
            x=first_value(v.get("GuildName"),v.get("guildName"),v.get("Name"),v.get("name"))
            if x:return x
    return None
def normalize(payload,uid):
    a=payload.get("AccountInfo") or payload.get("accountInfo") or payload.get("account") or {}
    return {"name":first_value(a.get("AccountName"),a.get("accountName"),a.get("name"),payload.get("name"),default="Unknown"),"uid":str(first_value(a.get("AccountId"),a.get("accountId"),a.get("UID"),a.get("uid"),payload.get("uid"),default=uid)),"level":first_value(a.get("AccountLevel"),a.get("accountLevel"),a.get("level"),payload.get("level"),default="—"),"likes":first_value(a.get("AccountLikes"),a.get("accountLikes"),a.get("likes"),payload.get("likes"),default="—"),"guild":extract_guild(payload) or "No guild"}
@app.get("/api/health")
def health(): return jsonify({"ok":True,"provider_configured":bool(API_KEY)})
@app.get("/api/player/verify")
def verify():
    uid=(request.args.get("uid") or "").strip(); region=(request.args.get("region") or "IND").upper().strip()
    if not uid.isdigit() or not 6<=len(uid)<=20:return jsonify(success=False,error="Enter a valid numeric UID."),400
    if region!="IND":region="IND"
    if not API_KEY:return jsonify(success=False,error="Player verification is not configured on the server yet."),503
    c=CACHE.get((uid,region))
    if c and time.time()-c[0]<CACHE_TTL:return jsonify(success=True,player=c[1],cached=True)
    try:r=requests.get(f"{API_BASE}/ff-info/get",params={"uid":uid,"region":region},headers={"x-api-key":API_KEY,"Accept":"application/json"},timeout=12)
    except requests.RequestException:return jsonify(success=False,error="Player service is temporarily unavailable. Please try again."),502
    try:p=r.json()
    except ValueError:p={}
    if r.status_code==401:return jsonify(success=False,error="Player verification service rejected the server key."),502
    if r.status_code in (402,404):return jsonify(success=False,error="Player not found. Check the UID and try again."),404
    if r.status_code==429:return jsonify(success=False,error="Verification is temporarily rate-limited. Please try again in a moment."),429
    if r.status_code>=400:return jsonify(success=False,error=p.get("error","Unable to verify this player right now.")),502
    player=normalize(p,uid); CACHE[(uid,region)]=(time.time(),player); return jsonify(success=True,player=player,cached=False)
if __name__=="__main__":app.run(host="0.0.0.0",port=int(os.environ.get("PORT",10000)))
