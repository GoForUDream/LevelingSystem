# Rank titles based on user level
# Inspired by Solo Leveling ranking system

# (min_level, max_level, title, theme)
RANK_TITLES = [
    (1, 5, "Awakened One", "Just discovered their potential"),
    (6, 10, "Beginner Warrior", "Starting the journey"),
    (11, 20, "Task Slayer", "Learning to conquer daily challenges"),
    (21, 30, "Dungeon Crawler", "Consistently tackling goals"),
    (31, 40, "Goal Hunter", "Actively pursuing objectives"),
    (41, 50, "Elite Achiever", "Proven track record"),
    (51, 60, "S-Rank Executor", "High-level discipline"),
    (61, 70, "Master of Habits", "Habits are now second nature"),
    (71, 80, "Sovereign of Will", "Unshakeable determination"),
    (81, 90, "Ruler of Self", "Complete self-mastery"),
    (91, 99, "Monarch's Equal", "Among the elite few"),
    (100, 100, "Shadow Monarch", "Absolute discipline, unlimited potential"),
]


def get_rank_title(level: int) -> str:
    """Get the rank title for a given level."""
    for min_level, max_level, title, _ in RANK_TITLES:
        if min_level <= level <= max_level:
            return title
    return "Awakened One"


def get_rank_theme(level: int) -> str:
    """Get the rank theme/description for a given level."""
    for min_level, max_level, _, theme in RANK_TITLES:
        if min_level <= level <= max_level:
            return theme
    return "Just discovered their potential"


def get_rank_info(level: int) -> dict:
    """Get both rank title and theme for a given level."""
    for min_level, max_level, title, theme in RANK_TITLES:
        if min_level <= level <= max_level:
            return {"title": title, "theme": theme}
    return {"title": "Awakened One", "theme": "Just discovered their potential"}
