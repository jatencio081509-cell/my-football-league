# Assets – logos & field art

Drop your image/video files into these folders. The app looks for them by **exact file name**.

## Folder layout

```
assets/
  logos/
    app/
      logo.png          ← app logo (sidebar, team pages fallback)
      loading.mp4       ← preferred: 10-second animated intro (or .webm)
      loading.gif       ← alternative animated intro
      loading.png       ← static fallback if no video/gif
    teams/
      Boston-Oceans.png
      Denver-Mountaineers.png
      ...               ← one file per team (see list below)
  field/
    field.png           ← football field background in live game
```

## Team logo file names

Use this exact pattern: `City-Name.png` (spaces allowed in the city).

| File name |
|-----------|
| Boston-Oceans.png |
| Denver-Mountaineers.png |
| Louisville-Chickens.png |
| Honolulu-Stars.png |
| Austin-Bullriders.png |
| New York-Emperors.png |
| Buffalo-Beavers.png |
| Portland-Wildcats.png |
| Oklahoma City-Brawlers.png |
| Detroit-Wolverines.png |
| Minneapolis-Lakers.png |
| Washington-Presidents.png |
| Huntsville-Rockets.png |
| Anchorage-Snowcaps.png |
| New Orleans-Pelicans.png |
| Salt Lake City-Bees.png |
| Burlington-Foresters.png |
| Sacramento-Goldnuggets.png |
| Los Angeles-Rangers.png |
| Miami-Billionaires.png |
| Houston-Flyers.png |
| Billings-Pirates.png |
| Lincoln-Cornhusks.png |
| Madison-Badgers.png |
| Cheyenne-Towers.png |
| Las Vegas-Bluejays.png |
| Manchester-Finches.png |
| Jackson-Magnolias.png |
| Kansas City-Borders.png |
| Indianapolis-Racers.png |
| Seattle-Tree Bearers.png |
| Charleston-Cardinals.png |

Supported formats: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`  
(For team logos the app tries `.png` first, then `.jpg`, then `.webp`.)

## Loading screen (10 second intro)

1. Put your animation in `assets/logos/app/` as **`loading.mp4`** or **`loading.webm`** (or `loading.gif`).
2. On launch the app shows it for **10 seconds** (or until the video ends, whichever is longer up to 10s).
3. If no media is found, it shows `logo.png` + the league name, still for 10 seconds.

## Tips

- Keep team logos roughly **square** (e.g. 256×256 or 512×512).
- App logo works well around **200×200** or a wide lockup.
- Field image: wide landscape (e.g. 1600×600) looks best behind the scoreboard.
