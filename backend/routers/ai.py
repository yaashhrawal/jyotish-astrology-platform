"""
AI layer: Claude API for chart interpretation + classical text Q&A.
"""
import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import anthropic
from core.auth import get_current_user
from core.db import get_pool

router = APIRouter(tags=["ai"])

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

SYSTEM_PROMPT = """You are Grahika AI — an expert Vedic astrology (Jyotish) assistant trained on classical texts:
BPHS (Brihat Parashara Hora Shastra), Phaladeepika, Saravali, Jataka Parijata, and Uttara Kalamrita.

Rules:
- Always cite the classical text and chapter when making claims (e.g., "Per BPHS Ch. 24...")
- Use Parashari system by default unless user specifies Jaimini or KP
- Distinguish between D1 (Rashi) and Navamsha (D9) interpretations
- Be specific about house lords, sign placement, and aspects
- For predictions: always mention the relevant Dasha period
- Never make medical diagnoses. For health queries, note "consult a physician"
- When chart data is provided, refer to actual placements
- Use technical Jyotish terms (Graha, Rashi, Bhava, Dasha, Yoga) alongside English

Format: structured, paragraph-based. Use markdown. Be concise but thorough."""


class InterpretRequest(BaseModel):
    question: str
    chart_id: str = None      # optional — loads chart from DB
    chart_data: dict = None   # optional — inline chart data


class ResearchQueryRequest(BaseModel):
    query: str                # natural language research question
    filters: dict = {}        # optional filter context


@router.post("/ai/interpret")
async def interpret(req: InterpretRequest, current_user=Depends(get_current_user)):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "ANTHROPIC_API_KEY not configured")

    chart_context = ""
    if req.chart_id:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT name, chart_data, ascendant_sign, moon_sign, atmakaraka, active_md, yogas FROM charts WHERE id=$1 AND (user_id=$2 OR is_public=true)",
                req.chart_id, current_user["sub"]
            )
        if row:
            cd = json.loads(row["chart_data"]) if row.get("chart_data") else {}
            planets = cd.get("planets", {})
            planet_summary = "\n".join(
                f"  {name}: {p.get('sign')} H{p.get('house')} {p.get('degree', 0):.1f}° {p.get('nakshatra')} {'(R)' if p.get('retrograde') else ''} [{p.get('status','')}]"
                for name, p in planets.items()
            )
            chart_context = f"""
Chart: {row['name']}
Ascendant: {row['ascendant_sign']}
Moon Sign: {row['moon_sign']}
Atmakaraka: {row['atmakaraka']}
Active Mahadasha: {row['active_md']}
Yogas: {', '.join(row['yogas'] or [])}

Planet Positions:
{planet_summary}
"""
    elif req.chart_data:
        chart_context = f"Chart Data:\n{json.dumps(req.chart_data, indent=2)}"

    messages = []
    if chart_context:
        messages.append({"role": "user", "content": f"<chart_data>\n{chart_context}\n</chart_data>\n\n{req.question}"})
    else:
        messages.append({"role": "user", "content": req.question})

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=messages,
    )

    return {
        "answer": response.content[0].text,
        "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
    }


@router.post("/ai/research")
async def research_query(req: ResearchQueryRequest, current_user=Depends(get_current_user)):
    """Natural language research over classical Jyotish knowledge."""
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "ANTHROPIC_API_KEY not configured")

    filter_context = f"\nFilter context: {json.dumps(req.filters)}" if req.filters else ""
    prompt = f"""Research query: {req.query}{filter_context}

Please answer from classical Jyotish perspective with:
1. Classical references (BPHS, Phaladeepika, etc.)
2. Key placements/yogas relevant to this query
3. Statistical tendencies if known from classical tradition
4. Practical interpretation notes"""

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    return {"answer": response.content[0].text}
