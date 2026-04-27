import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv optional; set env vars manually in prod
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from collections import defaultdict
import time
from core.db import get_pool, close_pool
from routers import chart, dasha, transit, ashtakavarga, yogas, compatibility, live, varga
from routers import auth, charts_db, crm, research, shadbala, ai, prashna, panchanga, doshas, synastry
from routers import astrologer_profile, reports as business_reports
from routers import varshaphal, muhurta, kp, arudha, yogini_dasha, aspects, chara_dasha, sarvatobhadra
from routers import bhava_chalit, jaimini_karakas, combustion, sudarshana, ashtottari, narayana_dasha
from routers import special_lagnas, dignity
from routers import kalachakra, shoola_dasha, kota_chakra, gochara, bhava_madhya
from routers import upagrahas, transit_hits
from routers import tithi_pravesha, sahams, ayurdaya, jaimini_aspects
from routers import saptarishis, pancha_pakshi, lagnesh_analysis
from routers import remedies
from routers import misc_dashas
from routers import vimshopaka
from routers import rectification
from routers import varga_dasha
from routers import classical_texts
from routers import famous_charts
from routers import numerology
from routers import avasthas
from routers import karakamsha
from routers import argala
from routers import conditional_dashas
from routers import upapada
from routers import varnada


limiter = Limiter(key_func=get_remote_address)

# Simple sliding-window rate limiter for /api/calc/* routes
_calc_hits: dict = defaultdict(list)
CALC_RATE_LIMIT = 60   # requests
CALC_RATE_WINDOW = 60  # seconds

class CalcRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/calc/"):
            ip = get_remote_address(request)
            now = time.time()
            window_start = now - CALC_RATE_WINDOW
            hits = [t for t in _calc_hits[ip] if t > window_start]
            if len(hits) >= CALC_RATE_LIMIT:
                return Response(
                    content='{"detail":"Rate limit exceeded: 60 calc requests/minute"}',
                    status_code=429, media_type="application/json"
                )
            hits.append(now)
            _calc_hits[ip] = hits
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await get_pool()
    except Exception as e:
        print(f"[DB] Connection failed (calc-only mode): {e}")
    yield
    await close_pool()


app = FastAPI(title="Jyotish Engine", version="2.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(CalcRateLimitMiddleware)

# CORS — lock to your domain in prod via ALLOWED_ORIGINS env var
# Dev default allows localhost. Prod: set ALLOWED_ORIGINS=https://yourdomain.com
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=True,
)

# Calculation engine (no auth)
app.include_router(chart.router,          prefix="/api/calc")
app.include_router(dasha.router,          prefix="/api/calc")
app.include_router(transit.router,        prefix="/api/calc")
app.include_router(ashtakavarga.router,   prefix="/api/calc")
app.include_router(yogas.router,          prefix="/api/calc")
app.include_router(compatibility.router,  prefix="/api/calc")
app.include_router(live.router,           prefix="/api/calc")
app.include_router(varga.router,          prefix="/api/calc")
app.include_router(shadbala.router,       prefix="/api/calc")
app.include_router(prashna.router,        prefix="/api/calc")
app.include_router(panchanga.router,      prefix="/api/calc")
app.include_router(doshas.router,         prefix="/api/calc")
app.include_router(synastry.router,       prefix="/api/calc")
app.include_router(varshaphal.router,     prefix="/api/calc")
app.include_router(muhurta.router,        prefix="/api/calc")
app.include_router(kp.router,             prefix="/api/calc")
app.include_router(arudha.router,         prefix="/api/calc")
app.include_router(yogini_dasha.router,   prefix="/api/calc")
app.include_router(aspects.router,        prefix="/api/calc")
app.include_router(chara_dasha.router,    prefix="/api/calc")
app.include_router(sarvatobhadra.router,  prefix="/api/calc")
app.include_router(bhava_chalit.router,   prefix="/api/calc")
app.include_router(jaimini_karakas.router, prefix="/api/calc")
app.include_router(combustion.router,     prefix="/api/calc")
app.include_router(sudarshana.router,     prefix="/api/calc")
app.include_router(ashtottari.router,     prefix="/api/calc")
app.include_router(narayana_dasha.router, prefix="/api/calc")
app.include_router(special_lagnas.router, prefix="/api/calc")
app.include_router(dignity.router,        prefix="/api/calc")
app.include_router(kalachakra.router,     prefix="/api/calc")
app.include_router(shoola_dasha.router,   prefix="/api/calc")
app.include_router(kota_chakra.router,    prefix="/api/calc")
app.include_router(gochara.router,        prefix="/api/calc")
app.include_router(bhava_madhya.router,   prefix="/api/calc")
app.include_router(upagrahas.router,      prefix="/api/calc")
app.include_router(transit_hits.router,   prefix="/api/calc")
app.include_router(tithi_pravesha.router, prefix="/api/calc")
app.include_router(sahams.router,         prefix="/api/calc")
app.include_router(ayurdaya.router,       prefix="/api/calc")
app.include_router(jaimini_aspects.router,prefix="/api/calc")
app.include_router(saptarishis.router,    prefix="/api/calc")
app.include_router(pancha_pakshi.router,  prefix="/api/calc")
app.include_router(lagnesh_analysis.router, prefix="/api/calc")
app.include_router(remedies.router,         prefix="/api/calc")
app.include_router(misc_dashas.router,      prefix="/api/calc")
app.include_router(vimshopaka.router,       prefix="/api/calc")
app.include_router(rectification.router,    prefix="/api/calc")
app.include_router(varga_dasha.router,      prefix="/api/calc")
app.include_router(classical_texts.router,  prefix="/api/calc")
app.include_router(famous_charts.router,    prefix="/api/calc")
app.include_router(numerology.router,       prefix="/api/calc")
app.include_router(avasthas.router,         prefix="/api/calc")
app.include_router(karakamsha.router,       prefix="/api/calc")
app.include_router(argala.router,           prefix="/api/calc")
app.include_router(conditional_dashas.router, prefix="/api/calc")
app.include_router(upapada.router,            prefix="/api/calc")
app.include_router(varnada.router,            prefix="/api/calc")

# Auth
app.include_router(auth.router,           prefix="/api")

# DB-backed features (auth required)
app.include_router(charts_db.router,      prefix="/api")
app.include_router(crm.router,            prefix="/api")
app.include_router(research.router,       prefix="/api")
app.include_router(ai.router,             prefix="/api")

# Business modules (Phase 1)
app.include_router(astrologer_profile.router, prefix="/api")
app.include_router(business_reports.router,   prefix="/api")

# Static uploads (logos, photos, signatures)
import os as _os
from pathlib import Path as _Path
from fastapi.staticfiles import StaticFiles
_uploads_dir = _Path(_os.getenv("UPLOAD_DIR", "/tmp/jyotish-uploads"))
_uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")


@app.get("/")
@limiter.limit("30/minute")
def root(request: Request):
    return {"status": "Jyotish Engine v2.0 running", "mode": "full"}
