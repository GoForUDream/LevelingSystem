# Level thresholds based on formula: EXP_needed = 100 × (Level ^ 1.8)
# Pre-calculated for fast lookup

from constants.ranks import get_rank_info

# Total EXP required to reach each level
LEVEL_THRESHOLDS = {
    1: 0,
    2: 100,
    3: 250,
    4: 450,
    5: 720,
    6: 1_070,
    7: 1_510,
    8: 2_060,
    9: 2_740,
    10: 3_560,
    11: 4_530,
    12: 5_660,
    13: 6_960,
    14: 8_440,
    15: 10_110,
    16: 11_980,
    17: 14_060,
    18: 16_360,
    19: 18_890,
    20: 21_660,
    21: 24_680,
    22: 27_960,
    23: 31_510,
    24: 35_340,
    25: 39_460,
    26: 43_880,
    27: 48_610,
    28: 53_660,
    29: 59_040,
    30: 64_760,
    31: 70_830,
    32: 77_260,
    33: 84_060,
    34: 91_240,
    35: 98_810,
    36: 106_780,
    37: 115_160,
    38: 123_970,
    39: 133_210,
    40: 142_900,
    41: 153_050,
    42: 163_670,
    43: 174_770,
    44: 186_360,
    45: 198_460,
    46: 211_080,
    47: 224_220,
    48: 237_910,
    49: 252_150,
    50: 266_960,
    51: 282_350,
    52: 298_330,
    53: 314_910,
    54: 332_100,
    55: 349_920,
    56: 368_370,
    57: 387_480,
    58: 407_250,
    59: 427_700,
    60: 448_840,
    61: 470_690,
    62: 493_260,
    63: 516_560,
    64: 540_610,
    65: 565_420,
    66: 591_000,
    67: 617_370,
    68: 644_540,
    69: 672_530,
    70: 701_350,
    71: 731_020,
    72: 761_550,
    73: 792_960,
    74: 825_260,
    75: 858_470,
    76: 892_600,
    77: 927_670,
    78: 963_690,
    79: 1_000_680,
    80: 1_038_660,
    81: 1_077_640,
    82: 1_117_640,
    83: 1_158_670,
    84: 1_200_750,
    85: 1_243_890,
    86: 1_288_110,
    87: 1_333_420,
    88: 1_379_840,
    89: 1_427_380,
    90: 1_476_060,
    91: 1_525_890,
    92: 1_576_890,
    93: 1_629_070,
    94: 1_682_450,
    95: 1_737_040,
    96: 1_792_860,
    97: 1_849_920,
    98: 1_908_240,
    99: 1_967_830,
    100: 2_028_710,
}

# Max level in the system
MAX_LEVEL = 100

# EXP values for task importance
IMPORTANCE_EXP = {
    "TRIVIAL": 10,
    "LOW": 25,
    "MEDIUM": 50,
    "HIGH": 100,
    "CRITICAL": 200,
}


def get_level_from_exp(total_exp: int) -> int:
    """Get the level for a given total EXP amount."""
    level = 1
    for lvl, threshold in LEVEL_THRESHOLDS.items():
        if total_exp >= threshold:
            level = lvl
        else:
            break
    return min(level, MAX_LEVEL)


def get_exp_for_next_level(current_level: int) -> int:
    """Get the total EXP required to reach the next level."""
    if current_level >= MAX_LEVEL:
        return LEVEL_THRESHOLDS[MAX_LEVEL]
    return LEVEL_THRESHOLDS.get(current_level + 1, LEVEL_THRESHOLDS[MAX_LEVEL])


def get_level_progress(total_exp: int) -> dict:
    """
    Get detailed level progress info.
    Returns: {
        level: current level,
        current_exp: EXP within current level,
        exp_to_next: EXP needed for next level,
        progress_percent: percentage to next level
    }
    """
    level = get_level_from_exp(total_exp)

    current_threshold = LEVEL_THRESHOLDS.get(level, 0)
    next_threshold = LEVEL_THRESHOLDS.get(level + 1, LEVEL_THRESHOLDS[MAX_LEVEL])

    exp_in_level = total_exp - current_threshold
    exp_for_level = next_threshold - current_threshold

    if level >= MAX_LEVEL:
        progress_percent = 100.0
    else:
        progress_percent = (exp_in_level / exp_for_level) * 100 if exp_for_level > 0 else 0

    rank_info = get_rank_info(level)

    return {
        "level": level,
        "total_exp": total_exp,
        "current_level_exp": exp_in_level,
        "exp_to_next_level": exp_for_level,
        "progress_percent": round(progress_percent, 1),
        "rank_title": rank_info["title"],
        "rank_theme": rank_info["theme"],
    }
