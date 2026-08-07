#!/usr/bin/env python3
"""
My Football League - Stage 1
Basic single game with play entry, score, clock, downs, and field position.
"""

from dataclasses import dataclass, field
from typing import List, Optional
import random


# ============================================
# TEAM DATA
# ============================================

TEAMS = [
    {"city": "Boston", "name": "Oceans", "state": "MA"},
    {"city": "Denver", "name": "Mountaineers", "state": "CO"},
    {"city": "Louisville", "name": "Chickens", "state": "KY"},
    {"city": "Honolulu", "name": "Stars", "state": "HI"},
    {"city": "Austin", "name": "Bullriders", "state": "TX"},
    {"city": "New York", "name": "Emperors", "state": "NY"},
    {"city": "Buffalo", "name": "Beavers", "state": "NY"},
    {"city": "Portland", "name": "Wildcats", "state": "OR"},
    {"city": "Oklahoma City", "name": "Brawlers", "state": "OK"},
    {"city": "Detroit", "name": "Wolverines", "state": "MI"},
    {"city": "Minneapolis", "name": "Lakers", "state": "MN"},
    {"city": "Washington", "name": "Presidents", "state": "DC"},
    {"city": "Huntsville", "name": "Rockets", "state": "AL"},
    {"city": "Anchorage", "name": "Snowcaps", "state": "AK"},
    {"city": "New Orleans", "name": "Pelicans", "state": "LA"},
    {"city": "Salt Lake City", "name": "Bees", "state": "UT"},
    {"city": "Burlington", "name": "Foresters", "state": "VT"},
    {"city": "Sacramento", "name": "Goldnuggets", "state": "CA"},
    {"city": "Los Angeles", "name": "Rangers", "state": "CA"},
    {"city": "Miami", "name": "Billionaires", "state": "FL"},
    {"city": "Houston", "name": "Flyers", "state": "TX"},
    {"city": "Billings", "name": "Pirates", "state": "MT"},
    {"city": "Lincoln", "name": "Cornhusks", "state": "NE"},
    {"city": "Madison", "name": "Badgers", "state": "WI"},
    {"city": "Cheyenne", "name": "Towers", "state": "WY"},
    {"city": "Las Vegas", "name": "Bluejays", "state": "NV"},
    {"city": "Manchester", "name": "Finches", "state": "NH"},
    {"city": "Jackson", "name": "Magnolias", "state": "MS"},
    {"city": "Kansas City", "name": "Borders", "state": "MO"},
    {"city": "Indianapolis", "name": "Racers", "state": "IN"},
    {"city": "Seattle", "name": "Tree Bearers", "state": "WA"},
    {"city": "Charleston", "name": "Cardinals", "state": "WV"},
]


def get_team_display(team: dict) -> str:
    return f"{team['city']} {team['name']}"


# ============================================
# GAME STATE
# ============================================

@dataclass
class GameState:
    home_team: dict
    away_team: dict
    home_score: int = 0
    away_score: int = 0
    quarter: int = 1
    clock_seconds: int = 15 * 60          # 15:00 per quarter
    possession: str = "home"              # "home" or "away"
    down: int = 1
    distance: int = 10
    yard_line: int = 25                   # starting at own 25 after kickoff (simplified)
    play_log: List[str] = field(default_factory=list)
    game_over: bool = False

    def clock_display(self) -> str:
        minutes = self.clock_seconds // 60
        seconds = self.clock_seconds % 60
        return f"{minutes}:{seconds:02d}"

    def field_position_display(self) -> str:
        if self.yard_line <= 50:
            return f"Own {self.yard_line}"
        else:
            return f"Opponent {100 - self.yard_line}"

    def current_team(self) -> dict:
        return self.home_team if self.possession == "home" else self.away_team

    def other_team(self) -> dict:
        return self.away_team if self.possession == "home" else self.home_team


# ============================================
# HELPER FUNCTIONS
# ============================================

def print_header():
    print("\n" + "=" * 50)
    print("       MY FOOTBALL LEAGUE - STAGE 1")
    print("=" * 50)


def print_scoreboard(game: GameState):
    print("\n" + "-" * 50)
    print(f"  {get_team_display(game.away_team):<25} {game.away_score}")
    print(f"  {get_team_display(game.home_team):<25} {game.home_score}")
    print("-" * 50)
    print(f"  Quarter: {game.quarter}     Clock: {game.clock_display()}")
    print(f"  Possession: {get_team_display(game.current_team())}")
    print(f"  Down: {game.down} & {game.distance}     Ball on: {game.field_position_display()}")
    print("-" * 50)


def list_teams():
    print("\nAvailable Teams:")
    for i, team in enumerate(TEAMS, 1):
        print(f"  {i:2d}. {get_team_display(team)}")


def choose_team(prompt: str) -> dict:
    while True:
        try:
            choice = int(input(prompt))
            if 1 <= choice <= len(TEAMS):
                return TEAMS[choice - 1]
            print("Please enter a number between 1 and 32.")
        except ValueError:
            print("Please enter a valid number.")


def start_new_game() -> GameState:
    print_header()
    list_teams()

    print("\nChoose the AWAY team:")
    away = choose_team("Away team number: ")

    print("\nChoose the HOME team:")
    home = choose_team("Home team number: ")

    while home == away:
        print("Home and Away teams must be different!")
        home = choose_team("Home team number: ")

    game = GameState(home_team=home, away_team=away)
    game.play_log.append(f"Game started: {get_team_display(away)} at {get_team_display(home)}")
    game.play_log.append("Kickoff — ball placed at the 25-yard line.")

    print(f"\nGame ready: {get_team_display(away)} at {get_team_display(home)}")
    return game


def apply_time(game: GameState, seconds: int):
    """Take time off the clock and handle quarter changes."""
    game.clock_seconds -= seconds
    if game.clock_seconds <= 0:
        game.clock_seconds = 0
        if game.quarter >= 4:
            game.game_over = True
            game.play_log.append("*** END OF GAME ***")
        else:
            game.quarter += 1
            game.clock_seconds = 15 * 60
            game.play_log.append(f"--- End of Quarter {game.quarter - 1} ---")
            print(f"\n*** End of Quarter {game.quarter - 1} ***")


def process_play(game: GameState):
    """Simple play entry for Stage 1."""
    print("\nAvailable play types:")
    print("  1. Run")
    print("  2. Pass Complete")
    print("  3. Pass Incomplete")
    print("  4. Sack")
    print("  5. Interception")
    print("  6. Fumble")
    print("  7. Punt")
    print("  8. Field Goal (Made)")
    print("  9. Field Goal (Missed)")
    print(" 10. Touchdown")
    print(" 11. Extra Point (Good)")
    print(" 12. Extra Point (Missed)")
    print(" 13. 2-Point Conversion (Good)")
    print(" 14. 2-Point Conversion (Failed)")
    print(" 15. Safety")
    print("  0. End Game Early")

    try:
        choice = int(input("\nEnter play number: "))
    except ValueError:
        print("Invalid input.")
        return

    if choice == 0:
        game.game_over = True
        game.play_log.append("Game ended early by user.")
        return

    yards = 0
    if choice in [1, 2, 4]:  # plays that usually gain/lose yards
        try:
            yards = int(input("Yards gained (use negative for loss): "))
        except ValueError:
            yards = 0

    team_name = get_team_display(game.current_team())
    description = ""

    # Very simple time costs for Stage 1 (we will improve later)
    time_used = 30

    if choice == 1:  # Run
        description = f"{team_name} run for {yards} yards"
        game.yard_line += yards
        time_used = 35
    elif choice == 2:  # Pass Complete
        description = f"{team_name} pass complete for {yards} yards"
        game.yard_line += yards
        time_used = 30
    elif choice == 3:  # Pass Incomplete
        description = f"{team_name} pass incomplete"
        time_used = 12
    elif choice == 4:  # Sack
        description = f"{team_name} sacked for a loss of {abs(yards)} yards"
        game.yard_line += yards  # yards should be negative
        time_used = 25
    elif choice == 5:  # Interception
        description = f"INTERCEPTION by {get_team_display(game.other_team())}!"
        game.possession = "away" if game.possession == "home" else "home"
        game.down = 1
        game.distance = 10
        game.yard_line = 100 - game.yard_line  # flip field
        time_used = 20
    elif choice == 6:  # Fumble
        description = f"FUMBLE recovered by {get_team_display(game.other_team())}!"
        game.possession = "away" if game.possession == "home" else "home"
        game.down = 1
        game.distance = 10
        game.yard_line = 100 - game.yard_line
        time_used = 25
    elif choice == 7:  # Punt
        description = f"{team_name} punts"
        game.possession = "away" if game.possession == "home" else "home"
        game.down = 1
        game.distance = 10
        game.yard_line = 100 - (game.yard_line + 40)  # rough average punt
        if game.yard_line < 1:
            game.yard_line = 20
        time_used = 15
    elif choice == 8:  # FG Made
        description = f"FIELD GOAL is GOOD! 3 points for {team_name}"
        if game.possession == "home":
            game.home_score += 3
        else:
            game.away_score += 3
        # After FG → kickoff (simplified reset)
        game.possession = "away" if game.possession == "home" else "home"
        game.down = 1
        game.distance = 10
        game.yard_line = 25
        time_used = 10
    elif choice == 9:  # FG Missed
        description = f"Field goal is NO GOOD"
        game.possession = "away" if game.possession == "home" else "home"
        game.down = 1
        game.distance = 10
        game.yard_line = 100 - game.yard_line
        time_used = 10
    elif choice == 10:  # Touchdown
        description = f"TOUCHDOWN {team_name}!!!"
        if game.possession == "home":
            game.home_score += 6
        else:
            game.away_score += 6
        time_used = 15
        # Note: extra point / 2-pt will be entered as the next play
    elif choice == 11:  # XP Good
        description = f"Extra point is GOOD"
        if game.possession == "home":
            game.home_score += 1
        else:
            game.away_score += 1
        game.possession = "away" if game.possession == "home" else "home"
        game.down = 1
        game.distance = 10
        game.yard_line = 25
        time_used = 5
    elif choice == 12:  # XP Missed
        description = f"Extra point is MISSED"
        game.possession = "away" if game.possession == "home" else "home"
        game.down = 1
        game.distance = 10
        game.yard_line = 25
        time_used = 5
    elif choice == 13:  # 2-pt Good
        description = f"2-POINT CONVERSION SUCCESSFUL!"
        if game.possession == "home":
            game.home_score += 2
        else:
            game.away_score += 2
        game.possession = "away" if game.possession == "home" else "home"
        game.down = 1
        game.distance = 10
        game.yard_line = 25
        time_used = 8
    elif choice == 14:  # 2-pt Failed
        description = f"2-point conversion FAILED"
        game.possession = "away" if game.possession == "home" else "home"
        game.down = 1
        game.distance = 10
        game.yard_line = 25
        time_used = 8
    elif choice == 15:  # Safety
        description = f"SAFETY! 2 points for {get_team_display(game.other_team())}"
        if game.possession == "home":
            game.away_score += 2
        else:
            game.home_score += 2
        game.possession = "away" if game.possession == "home" else "home"
        game.down = 1
        game.distance = 10
        game.yard_line = 25
        time_used = 10
    else:
        print("Invalid play number.")
        return

    # Update downs for normal offensive plays
    if choice in [1, 2, 3, 4]:
        if yards >= game.distance:
            game.down = 1
            game.distance = 10
            description += " — FIRST DOWN!"
        else:
            game.down += 1
            game.distance -= yards
            if game.down > 4:
                description += " — TURNOVER ON DOWNS"
                game.possession = "away" if game.possession == "home" else "home"
                game.down = 1
                game.distance = 10
                game.yard_line = 100 - game.yard_line

    # Keep yard_line in bounds
    if game.yard_line < 0:
        game.yard_line = 0
    if game.yard_line > 100:
        game.yard_line = 100

    game.play_log.append(description)
    print(f"\n>>> {description}")

    apply_time(game, time_used)


def show_play_log(game: GameState):
    print("\n--- PLAY BY PLAY ---")
    for entry in game.play_log[-10:]:  # show last 10 plays
        print(f"  • {entry}")
    if len(game.play_log) > 10:
        print(f"  ... ({len(game.play_log) - 10} earlier plays)")


def main():
    print_header()
    print("Welcome to My Football League!")
    print("Stage 1 – Single Game Mode\n")

    game = start_new_game()

    while not game.game_over:
        print_scoreboard(game)
        show_play_log(game)
        process_play(game)

    # Final scoreboard
    print("\n" + "=" * 50)
    print("                 FINAL SCORE")
    print_scoreboard(game)
    print("\nThanks for playing!")


if __name__ == "__main__":
    main()
