"""
Career (10th house) — thin wrapper over the generic topic engine.
Kept for its stable signature; all logic lives in topic_engine.topic_factors,
driven by the 'career' config in topics.py.
"""
from .topic_engine import topic_factors
from .topics import get_topic


def career_factors(planets, lagna_idx, d10_planets, active_lords,
                   aspects_on_10th=None, sav_10th=None, scheme="parashari"):
    return topic_factors(get_topic("career"), planets, lagna_idx,
                         dvarga_planets=d10_planets, active_lords=active_lords,
                         aspects_on_house=aspects_on_10th, sav_house=sav_10th, scheme=scheme)
