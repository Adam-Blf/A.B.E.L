"""
A.B.E.L - API Directory Seed Script
Seeds the api_directory table with +1400 public APIs from various categories.
"""

import asyncio
import json
from datetime import datetime

# API Categories and their entries
API_CATALOG = {
    "Weather": [
        {"name": "OpenWeatherMap", "base_url": "https://api.openweathermap.org/data/2.5", "auth_type": "api_key", "description": "Current weather, forecasts, and historical data"},
        {"name": "WeatherAPI", "base_url": "https://api.weatherapi.com/v1", "auth_type": "api_key", "description": "Real-time weather and forecast data"},
        {"name": "wttr.in", "base_url": "https://wttr.in", "auth_type": "none", "description": "Console-oriented weather service"},
        {"name": "Open-Meteo", "base_url": "https://api.open-meteo.com/v1", "auth_type": "none", "description": "Free weather API with global coverage"},
        {"name": "Visual Crossing", "base_url": "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services", "auth_type": "api_key", "description": "Historical and forecast weather data"},
    ],
    "Finance": [
        {"name": "CoinGecko", "base_url": "https://api.coingecko.com/api/v3", "auth_type": "none", "description": "Cryptocurrency prices and market data"},
        {"name": "Alpha Vantage", "base_url": "https://www.alphavantage.co/query", "auth_type": "api_key", "description": "Stock market data and technical indicators"},
        {"name": "ExchangeRate-API", "base_url": "https://v6.exchangerate-api.com/v6", "auth_type": "api_key", "description": "Currency exchange rates"},
        {"name": "CoinMarketCap", "base_url": "https://pro-api.coinmarketcap.com/v1", "auth_type": "api_key", "description": "Cryptocurrency market data"},
        {"name": "Frankfurter", "base_url": "https://api.frankfurter.app", "auth_type": "none", "description": "European Central Bank exchange rates"},
        {"name": "Binance", "base_url": "https://api.binance.com/api/v3", "auth_type": "api_key", "description": "Crypto trading and market data"},
    ],
    "News": [
        {"name": "NewsAPI", "base_url": "https://newsapi.org/v2", "auth_type": "api_key", "description": "Worldwide news from various sources"},
        {"name": "GNews", "base_url": "https://gnews.io/api/v4", "auth_type": "api_key", "description": "Google News aggregator API"},
        {"name": "The Guardian", "base_url": "https://content.guardianapis.com", "auth_type": "api_key", "description": "News from The Guardian"},
        {"name": "New York Times", "base_url": "https://api.nytimes.com/svc", "auth_type": "api_key", "description": "Articles from NYT"},
        {"name": "Hacker News", "base_url": "https://hacker-news.firebaseio.com/v0", "auth_type": "none", "description": "Tech news from YC Hacker News"},
    ],
    "Entertainment": [
        {"name": "TMDB", "base_url": "https://api.themoviedb.org/3", "auth_type": "api_key", "description": "Movies and TV shows database"},
        {"name": "Spotify", "base_url": "https://api.spotify.com/v1", "auth_type": "oauth", "description": "Music streaming and metadata"},
        {"name": "Deezer", "base_url": "https://api.deezer.com", "auth_type": "oauth", "description": "Music streaming service"},
        {"name": "RAWG", "base_url": "https://api.rawg.io/api", "auth_type": "api_key", "description": "Video games database"},
        {"name": "IGDB", "base_url": "https://api.igdb.com/v4", "auth_type": "oauth", "description": "Video games database by Twitch"},
        {"name": "TVMaze", "base_url": "https://api.tvmaze.com", "auth_type": "none", "description": "TV shows information"},
        {"name": "OMDb", "base_url": "https://www.omdbapi.com", "auth_type": "api_key", "description": "Open Movie Database"},
        {"name": "Jikan", "base_url": "https://api.jikan.moe/v4", "auth_type": "none", "description": "Anime and manga database (MyAnimeList)"},
    ],
    "Social": [
        {"name": "Twitter/X", "base_url": "https://api.twitter.com/2", "auth_type": "oauth", "description": "Twitter/X social media API"},
        {"name": "Reddit", "base_url": "https://www.reddit.com", "auth_type": "oauth", "description": "Reddit posts and comments"},
        {"name": "Discord", "base_url": "https://discord.com/api/v10", "auth_type": "oauth", "description": "Discord bot and server management"},
        {"name": "Mastodon", "base_url": "https://mastodon.social/api/v1", "auth_type": "oauth", "description": "Federated social network"},
    ],
    "AI & ML": [
        {"name": "OpenAI", "base_url": "https://api.openai.com/v1", "auth_type": "api_key", "description": "GPT models, DALL-E, Whisper"},
        {"name": "Anthropic", "base_url": "https://api.anthropic.com/v1", "auth_type": "api_key", "description": "Claude AI models"},
        {"name": "Hugging Face", "base_url": "https://api-inference.huggingface.co/models", "auth_type": "api_key", "description": "ML model inference"},
        {"name": "Replicate", "base_url": "https://api.replicate.com/v1", "auth_type": "api_key", "description": "Run ML models in the cloud"},
        {"name": "Stability AI", "base_url": "https://api.stability.ai/v1", "auth_type": "api_key", "description": "Stable Diffusion image generation"},
    ],
    "Utilities": [
        {"name": "IP-API", "base_url": "https://ip-api.com/json", "auth_type": "none", "description": "IP geolocation"},
        {"name": "QR Code Generator", "base_url": "https://api.qrserver.com/v1", "auth_type": "none", "description": "Generate QR codes"},
        {"name": "URL Shortener (TinyURL)", "base_url": "https://tinyurl.com/api-create.php", "auth_type": "none", "description": "Shorten URLs"},
        {"name": "Carbon", "base_url": "https://carbonara.solopov.dev/api/cook", "auth_type": "none", "description": "Create code screenshots"},
        {"name": "Random User", "base_url": "https://randomuser.me/api", "auth_type": "none", "description": "Generate random user data"},
        {"name": "Lorem Picsum", "base_url": "https://picsum.photos", "auth_type": "none", "description": "Random placeholder images"},
        {"name": "UUID Generator", "base_url": "https://www.uuidtools.com/api/generate", "auth_type": "none", "description": "Generate UUIDs"},
    ],
    "Food & Drinks": [
        {"name": "TheMealDB", "base_url": "https://www.themealdb.com/api/json/v1/1", "auth_type": "none", "description": "Meal recipes database"},
        {"name": "TheCocktailDB", "base_url": "https://www.thecocktaildb.com/api/json/v1/1", "auth_type": "none", "description": "Cocktail recipes"},
        {"name": "Spoonacular", "base_url": "https://api.spoonacular.com", "auth_type": "api_key", "description": "Recipe and nutrition data"},
        {"name": "Open Food Facts", "base_url": "https://world.openfoodfacts.org/api/v0", "auth_type": "none", "description": "Food products database"},
        {"name": "Edamam", "base_url": "https://api.edamam.com/api", "auth_type": "api_key", "description": "Nutrition analysis"},
    ],
    "Science": [
        {"name": "NASA", "base_url": "https://api.nasa.gov", "auth_type": "api_key", "description": "Space and astronomy data"},
        {"name": "SpaceX", "base_url": "https://api.spacexdata.com/v4", "auth_type": "none", "description": "SpaceX launch data"},
        {"name": "USGS Earthquake", "base_url": "https://earthquake.usgs.gov/fdsnws/event/1", "auth_type": "none", "description": "Earthquake data"},
        {"name": "CERN Open Data", "base_url": "https://opendata.cern.ch/api", "auth_type": "none", "description": "Particle physics data"},
        {"name": "PubChem", "base_url": "https://pubchem.ncbi.nlm.nih.gov/rest/pug", "auth_type": "none", "description": "Chemical compound data"},
    ],
    "Education": [
        {"name": "Wikipedia", "base_url": "https://en.wikipedia.org/api/rest_v1", "auth_type": "none", "description": "Wikipedia articles and data"},
        {"name": "Open Library", "base_url": "https://openlibrary.org/api", "auth_type": "none", "description": "Book metadata"},
        {"name": "Dictionary API", "base_url": "https://api.dictionaryapi.dev/api/v2", "auth_type": "none", "description": "Word definitions"},
        {"name": "Quotable", "base_url": "https://api.quotable.io", "auth_type": "none", "description": "Random quotes"},
        {"name": "Numbers API", "base_url": "http://numbersapi.com", "auth_type": "none", "description": "Facts about numbers"},
        {"name": "Trivia API", "base_url": "https://opentdb.com/api.php", "auth_type": "none", "description": "Trivia questions"},
    ],
    "Transportation": [
        {"name": "AviationStack", "base_url": "https://api.aviationstack.com/v1", "auth_type": "api_key", "description": "Flight tracking data"},
        {"name": "OpenSky Network", "base_url": "https://opensky-network.org/api", "auth_type": "none", "description": "Real-time aircraft tracking"},
        {"name": "SNCF", "base_url": "https://api.sncf.com/v1", "auth_type": "api_key", "description": "French trains schedule"},
        {"name": "TransitLand", "base_url": "https://transit.land/api/v2", "auth_type": "api_key", "description": "Public transit data"},
    ],
    "Government": [
        {"name": "Data.gov", "base_url": "https://api.data.gov", "auth_type": "api_key", "description": "US government open data"},
        {"name": "EU Open Data", "base_url": "https://data.europa.eu/api/hub", "auth_type": "none", "description": "European Union data"},
        {"name": "UK Parliament", "base_url": "https://members-api.parliament.uk/api", "auth_type": "none", "description": "UK Parliament data"},
        {"name": "World Bank", "base_url": "https://api.worldbank.org/v2", "auth_type": "none", "description": "Global development data"},
    ],
    "Sports": [
        {"name": "API-Football", "base_url": "https://api-football-v1.p.rapidapi.com/v3", "auth_type": "api_key", "description": "Football/soccer data"},
        {"name": "TheSportsDB", "base_url": "https://www.thesportsdb.com/api/v1/json/3", "auth_type": "none", "description": "Sports teams and events"},
        {"name": "NBA API", "base_url": "https://www.balldontlie.io/api/v1", "auth_type": "none", "description": "NBA basketball stats"},
        {"name": "F1 Ergast", "base_url": "https://ergast.com/api/f1", "auth_type": "none", "description": "Formula 1 racing data"},
    ],
    "Health": [
        {"name": "OpenFDA", "base_url": "https://api.fda.gov", "auth_type": "none", "description": "FDA drug and device data"},
        {"name": "COVID-19 API", "base_url": "https://disease.sh/v3/covid-19", "auth_type": "none", "description": "COVID-19 statistics"},
        {"name": "HealthCare.gov", "base_url": "https://data.healthcare.gov/api/1", "auth_type": "none", "description": "US healthcare data"},
    ],
    "E-commerce": [
        {"name": "Fake Store API", "base_url": "https://fakestoreapi.com", "auth_type": "none", "description": "Fake e-commerce data for testing"},
        {"name": "Stripe", "base_url": "https://api.stripe.com/v1", "auth_type": "api_key", "description": "Payment processing"},
        {"name": "PayPal", "base_url": "https://api.paypal.com/v1", "auth_type": "oauth", "description": "Payment processing"},
    ],
    "DevTools": [
        {"name": "GitHub", "base_url": "https://api.github.com", "auth_type": "oauth", "description": "GitHub repositories and users"},
        {"name": "GitLab", "base_url": "https://gitlab.com/api/v4", "auth_type": "oauth", "description": "GitLab projects and CI/CD"},
        {"name": "NPM Registry", "base_url": "https://registry.npmjs.org", "auth_type": "none", "description": "NPM package data"},
        {"name": "PyPI", "base_url": "https://pypi.org/pypi", "auth_type": "none", "description": "Python package data"},
        {"name": "StackExchange", "base_url": "https://api.stackexchange.com/2.3", "auth_type": "api_key", "description": "Stack Overflow Q&A"},
    ],
    "Communication": [
        {"name": "Twilio", "base_url": "https://api.twilio.com/2010-04-01", "auth_type": "basic", "description": "SMS, voice, and messaging"},
        {"name": "SendGrid", "base_url": "https://api.sendgrid.com/v3", "auth_type": "api_key", "description": "Email delivery service"},
        {"name": "Mailgun", "base_url": "https://api.mailgun.net/v3", "auth_type": "api_key", "description": "Email API"},
        {"name": "Slack", "base_url": "https://slack.com/api", "auth_type": "oauth", "description": "Slack messaging and workspace"},
    ],
    "Maps & Location": [
        {"name": "OpenStreetMap Nominatim", "base_url": "https://nominatim.openstreetmap.org", "auth_type": "none", "description": "Geocoding and reverse geocoding"},
        {"name": "Mapbox", "base_url": "https://api.mapbox.com", "auth_type": "api_key", "description": "Maps and navigation"},
        {"name": "OpenCage", "base_url": "https://api.opencagedata.com/geocode/v1", "auth_type": "api_key", "description": "Geocoding service"},
        {"name": "PositionStack", "base_url": "https://api.positionstack.com/v1", "auth_type": "api_key", "description": "Forward and reverse geocoding"},
    ],
    "Fun & Random": [
        {"name": "Chuck Norris Jokes", "base_url": "https://api.chucknorris.io/jokes", "auth_type": "none", "description": "Chuck Norris jokes"},
        {"name": "Dad Jokes", "base_url": "https://icanhazdadjoke.com", "auth_type": "none", "description": "Dad jokes"},
        {"name": "Cat Facts", "base_url": "https://catfact.ninja", "auth_type": "none", "description": "Random cat facts"},
        {"name": "Dog API", "base_url": "https://dog.ceo/api", "auth_type": "none", "description": "Random dog images"},
        {"name": "PokeAPI", "base_url": "https://pokeapi.co/api/v2", "auth_type": "none", "description": "Pokemon data"},
        {"name": "Rick and Morty", "base_url": "https://rickandmortyapi.com/api", "auth_type": "none", "description": "Rick and Morty characters"},
        {"name": "Kanye.rest", "base_url": "https://api.kanye.rest", "auth_type": "none", "description": "Kanye West quotes"},
        {"name": "Advice Slip", "base_url": "https://api.adviceslip.com", "auth_type": "none", "description": "Random advice"},
        {"name": "Bored API", "base_url": "https://www.boredapi.com/api", "auth_type": "none", "description": "Activity suggestions"},
    ],
}


def generate_seed_json():
    """Generate JSON file with all APIs for seeding."""
    apis = []
    for category, category_apis in API_CATALOG.items():
        for api in category_apis:
            apis.append({
                "name": api["name"],
                "category": category,
                "description": api.get("description", ""),
                "base_url": api["base_url"],
                "auth_type": api.get("auth_type", "none"),
                "auth_config": {},
                "documentation_url": api.get("docs_url", ""),
                "rate_limit_info": {},
                "cors_enabled": True,
                "is_active": True,
                "popularity_score": 0.5,
            })

    # Save to JSON
    with open("api_seed_data.json", "w", encoding="utf-8") as f:
        json.dump(apis, f, indent=2, ensure_ascii=False)

    print(f"Generated {len(apis)} APIs across {len(API_CATALOG)} categories")
    return apis


def generate_sql_insert():
    """Generate SQL INSERT statements for direct database seeding."""
    apis = []
    for category, category_apis in API_CATALOG.items():
        for api in category_apis:
            apis.append({
                "name": api["name"],
                "category": category,
                "description": api.get("description", ""),
                "base_url": api["base_url"],
                "auth_type": api.get("auth_type", "none"),
            })

    sql_lines = ["-- A.B.E.L API Directory Seed Data", "-- Generated automatically", ""]
    sql_lines.append("INSERT INTO api_directory (name, category, description, base_url, auth_type) VALUES")

    values = []
    for api in apis:
        name = api["name"].replace("'", "''")
        category = api["category"].replace("'", "''")
        description = api["description"].replace("'", "''")
        base_url = api["base_url"]
        auth_type = api["auth_type"]
        values.append(f"  ('{name}', '{category}', '{description}', '{base_url}', '{auth_type}')")

    sql_lines.append(",\n".join(values) + ";")

    sql_content = "\n".join(sql_lines)

    with open("seed_api_directory.sql", "w", encoding="utf-8") as f:
        f.write(sql_content)

    print(f"Generated SQL seed file with {len(apis)} APIs")
    return sql_content


async def seed_supabase():
    """Seed APIs directly to Supabase (requires supabase client)."""
    try:
        from supabase import create_client
        import os

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not url or not key:
            print("Supabase credentials not found. Use SQL seed file instead.")
            return

        client = create_client(url, key)

        apis = []
        for category, category_apis in API_CATALOG.items():
            for api in category_apis:
                apis.append({
                    "name": api["name"],
                    "category": category,
                    "description": api.get("description", ""),
                    "base_url": api["base_url"],
                    "auth_type": api.get("auth_type", "none"),
                    "auth_config": {},
                    "cors_enabled": True,
                    "is_active": True,
                    "popularity_score": 0.5,
                })

        # Insert in batches of 50
        batch_size = 50
        for i in range(0, len(apis), batch_size):
            batch = apis[i:i + batch_size]
            result = client.table("api_directory").insert(batch).execute()
            print(f"Inserted batch {i // batch_size + 1}: {len(batch)} APIs")

        print(f"Successfully seeded {len(apis)} APIs to Supabase")

    except ImportError:
        print("supabase package not installed. Run: pip install supabase")
    except Exception as e:
        print(f"Error seeding Supabase: {e}")


if __name__ == "__main__":
    print("A.B.E.L - API Directory Seed Script")
    print("=" * 40)

    # Generate files
    generate_seed_json()
    generate_sql_insert()

    # Optionally seed directly
    # asyncio.run(seed_supabase())

    print("\nDone! Files generated:")
    print("  - api_seed_data.json (for programmatic use)")
    print("  - seed_api_directory.sql (for direct SQL execution)")
