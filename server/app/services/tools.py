"""
A.B.E.L Agent Tools - Outils gratuits sans clé API
- Recherche web (DuckDuckGo)
- Météo (wttr.in)
- Calculatrice (Python safe eval)
- Date/heure
- Mémoire (Supabase/local)
"""
import logging
import math
import re
import ast
import operator
from datetime import datetime, timezone
from typing import Any
import httpx

logger = logging.getLogger("abel.tools")

# ──────────────────────────────────────────────────────────────────────────────
# Calculatrice sécurisée (sans eval dangereux)
# ──────────────────────────────────────────────────────────────────────────────

_SAFE_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.Mod: operator.mod,
    ast.FloorDiv: operator.floordiv,
}

_SAFE_FUNCS = {
    "sqrt": math.sqrt,
    "abs": abs,
    "round": round,
    "floor": math.floor,
    "ceil": math.ceil,
    "log": math.log,
    "log10": math.log10,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "pi": math.pi,
    "e": math.e,
    "pow": math.pow,
    "factorial": math.factorial,
}


def _safe_eval_node(node: ast.AST) -> float:
    if isinstance(node, ast.Constant):
        return float(node.value)
    elif isinstance(node, ast.Name):
        if node.id in _SAFE_FUNCS:
            return _SAFE_FUNCS[node.id]  # type: ignore
        raise ValueError(f"Variable inconnue: {node.id}")
    elif isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in _SAFE_OPS:
            raise ValueError(f"Opérateur non autorisé")
        left = _safe_eval_node(node.left)
        right = _safe_eval_node(node.right)
        return _SAFE_OPS[op_type](left, right)
    elif isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in _SAFE_OPS:
            raise ValueError(f"Opérateur non autorisé")
        return _SAFE_OPS[op_type](_safe_eval_node(node.operand))
    elif isinstance(node, ast.Call):
        func_name = node.func.id if isinstance(node.func, ast.Name) else None
        if func_name not in _SAFE_FUNCS:
            raise ValueError(f"Fonction non autorisée: {func_name}")
        args = [_safe_eval_node(a) for a in node.args]
        return _SAFE_FUNCS[func_name](*args)  # type: ignore
    else:
        raise ValueError(f"Expression non autorisée: {type(node).__name__}")


def calculate(expression: str) -> str:
    """Calcule une expression mathématique en toute sécurité."""
    try:
        # Nettoyage de base
        expr = expression.strip()
        expr = expr.replace("^", "**").replace("×", "*").replace("÷", "/")
        expr = re.sub(r"[^\d\s+\-*/().,%a-zA-Z_]", "", expr)

        tree = ast.parse(expr, mode="eval")
        result = _safe_eval_node(tree.body)

        # Formatage du résultat
        if isinstance(result, float) and result.is_integer():
            return f"{expression} = {int(result):,}".replace(",", " ")
        elif isinstance(result, float):
            return f"{expression} = {result:.10g}"
        return f"{expression} = {result}"
    except ZeroDivisionError:
        return "Erreur: division par zéro"
    except Exception as e:
        return f"Erreur de calcul: {str(e)}"


# ──────────────────────────────────────────────────────────────────────────────
# Date & Heure
# ──────────────────────────────────────────────────────────────────────────────

def get_datetime() -> str:
    """Retourne la date et l'heure actuelles."""
    now = datetime.now()
    day_names = {
        0: "lundi", 1: "mardi", 2: "mercredi", 3: "jeudi",
        4: "vendredi", 5: "samedi", 6: "dimanche"
    }
    month_names = {
        1: "janvier", 2: "février", 3: "mars", 4: "avril",
        5: "mai", 6: "juin", 7: "juillet", 8: "août",
        9: "septembre", 10: "octobre", 11: "novembre", 12: "décembre"
    }
    return (
        f"{day_names[now.weekday()].capitalize()} {now.day} "
        f"{month_names[now.month]} {now.year}, "
        f"{now.strftime('%H:%M:%S')}"
    )


# ──────────────────────────────────────────────────────────────────────────────
# Météo (wttr.in - gratuit, sans clé API)
# ──────────────────────────────────────────────────────────────────────────────

async def get_weather(city: str) -> str:
    """Récupère la météo d'une ville via wttr.in (100% gratuit)."""
    try:
        city_encoded = city.strip().replace(" ", "+")
        url = f"https://wttr.in/{city_encoded}?format=j1&lang=fr"

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        current = data["current_condition"][0]
        temp_c = current["temp_C"]
        feels_like = current["FeelsLikeC"]
        humidity = current["humidity"]
        desc = current.get("lang_fr", [{}])[0].get("value", current.get("weatherDesc", [{}])[0].get("value", "N/A"))
        wind_kmph = current["windspeedKmph"]
        wind_dir = current["winddir16Point"]

        # Données du jour
        weather_day = data.get("weather", [{}])[0]
        max_temp = weather_day.get("maxtempC", "?")
        min_temp = weather_day.get("mintempC", "?")

        return (
            f"**Météo à {city}** :\n"
            f"- 🌡️ Température : {temp_c}°C (ressenti {feels_like}°C)\n"
            f"- 📊 Min/Max du jour : {min_temp}°C / {max_temp}°C\n"
            f"- 💧 Humidité : {humidity}%\n"
            f"- 💨 Vent : {wind_kmph} km/h ({wind_dir})\n"
            f"- ☁️ Conditions : {desc}"
        )
    except httpx.TimeoutException:
        return f"Timeout lors de la récupération de la météo pour {city}"
    except Exception as e:
        logger.error(f"Weather error: {e}")
        return f"Impossible de récupérer la météo pour '{city}'. Vérifiez le nom de la ville."


# ──────────────────────────────────────────────────────────────────────────────
# Recherche Web (DuckDuckGo - gratuit, sans clé API)
# ──────────────────────────────────────────────────────────────────────────────

async def search_web(query: str, max_results: int = 4) -> str:
    """Recherche sur le web via DuckDuckGo (100% gratuit, sans clé API)."""
    try:
        from duckduckgo_search import DDGS

        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results, region="fr-fr"):
                results.append(r)

        if not results:
            return f"Aucun résultat trouvé pour '{query}'"

        formatted = [f"**Résultats de recherche pour : \"{query}\"**\n"]
        for i, r in enumerate(results, 1):
            title = r.get("title", "Sans titre")
            body = r.get("body", "")[:200]
            href = r.get("href", "")
            formatted.append(f"{i}. **{title}**\n   {body}...\n   🔗 {href}\n")

        return "\n".join(formatted)
    except ImportError:
        return "Module duckduckgo-search non installé. Lancez : pip install duckduckgo-search"
    except Exception as e:
        logger.error(f"Web search error: {e}")
        return f"Erreur lors de la recherche : {str(e)}"


# ──────────────────────────────────────────────────────────────────────────────
# Convertisseur de devises (ratesapi - gratuit)
# ──────────────────────────────────────────────────────────────────────────────

async def convert_currency(amount: float, from_currency: str, to_currency: str) -> str:
    """Convertit une devise (via API gratuite)."""
    try:
        from_c = from_currency.upper()
        to_c = to_currency.upper()
        url = f"https://api.frankfurter.app/latest?from={from_c}&to={to_c}"

        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        rate = data["rates"].get(to_c)
        if not rate:
            return f"Devise {to_c} non trouvée"

        converted = amount * rate
        return f"**Conversion** : {amount:,.2f} {from_c} = **{converted:,.2f} {to_c}**\n(Taux : 1 {from_c} = {rate} {to_c})"
    except Exception as e:
        logger.error(f"Currency error: {e}")
        return f"Erreur de conversion: {str(e)}"


# ──────────────────────────────────────────────────────────────────────────────
# Résumé d'URL (basique, extrait le texte principal)
# ──────────────────────────────────────────────────────────────────────────────

async def fetch_url(url: str) -> str:
    """Récupère et résume le contenu d'une URL."""
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; ABEL/1.0)"}
        async with httpx.AsyncClient(timeout=15, headers=headers, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()

        content_type = resp.headers.get("content-type", "")
        if "html" not in content_type:
            return f"Contenu non-HTML ({content_type}), impossible à résumer"

        # Extraction basique du texte (sans beautifulsoup)
        html = resp.text
        # Supprimer les scripts, styles, etc.
        html = re.sub(r"<script[^>]*>[\s\S]*?</script>", "", html, flags=re.IGNORECASE)
        html = re.sub(r"<style[^>]*>[\s\S]*?</style>", "", html, flags=re.IGNORECASE)
        # Extraire le texte des balises
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()
        # Limiter
        preview = text[:1500] + "..." if len(text) > 1500 else text

        return f"**Contenu de {url}** :\n\n{preview}"
    except Exception as e:
        logger.error(f"URL fetch error: {e}")
        return f"Impossible de récupérer '{url}': {str(e)}"


# ──────────────────────────────────────────────────────────────────────────────
# Registre des outils disponibles
# ──────────────────────────────────────────────────────────────────────────────

TOOLS_DESCRIPTION = """
Tu as accès aux outils suivants. Pour les utiliser, inclus exactement ce format dans ta réponse :

<outil>{"nom": "TOOL_NAME", "params": PARAMS_JSON}</outil>

Outils disponibles :
1. **search_web** - Rechercher sur internet
   Params: {"query": "votre recherche"}
   Usage: pour trouver des infos récentes, actualités, faits

2. **get_weather** - Météo d'une ville
   Params: {"city": "Paris"}
   Usage: pour la météo actuelle et prévisions

3. **calculate** - Calculatrice scientifique
   Params: {"expression": "2^10 + sqrt(144)"}
   Fonctions: sqrt, abs, round, floor, ceil, log, sin, cos, tan, pi, e, factorial

4. **get_datetime** - Date et heure actuelle
   Params: {}
   Usage: pour connaître la date/heure actuelle

5. **convert_currency** - Conversion de devises
   Params: {"amount": 100, "from": "EUR", "to": "USD"}
   Usage: pour convertir des montants entre devises

6. **fetch_url** - Lire le contenu d'une URL
   Params: {"url": "https://example.com"}
   Usage: pour analyser une page web ou un article

RÈGLES D'UTILISATION :
- N'utilise un outil que si c'est VRAIMENT nécessaire pour répondre
- Tu peux utiliser plusieurs outils si besoin
- Après avoir utilisé un outil, synthétise les résultats dans une réponse claire
- Pour les calculs simples de tête (1+1, etc.), ne pas utiliser d'outil
"""

TOOL_REGISTRY = {
    "search_web": search_web,
    "get_weather": get_weather,
    "calculate": calculate,
    "get_datetime": get_datetime,
    "convert_currency": convert_currency,
    "fetch_url": fetch_url,
}


async def execute_tool(name: str, params: dict) -> str:
    """Exécute un outil et retourne le résultat."""
    tool = TOOL_REGISTRY.get(name)
    if not tool:
        return f"Outil '{name}' non trouvé"

    try:
        import asyncio
        import inspect

        if inspect.iscoroutinefunction(tool):
            return await tool(**params)
        else:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, lambda: tool(**params))
    except TypeError as e:
        return f"Paramètres invalides pour '{name}': {str(e)}"
    except Exception as e:
        logger.error(f"Tool execution error ({name}): {e}")
        return f"Erreur lors de l'exécution de '{name}': {str(e)}"


def parse_tool_calls(text: str) -> list[dict]:
    """Extrait les appels d'outils du texte LLM."""
    import json
    pattern = re.compile(r"<outil>(.*?)</outil>", re.DOTALL)
    calls = []
    for match in pattern.finditer(text):
        try:
            raw = match.group(1).strip()
            data = json.loads(raw)
            if "nom" in data and "params" in data:
                calls.append({"name": data["nom"], "params": data["params"], "raw": match.group(0)})
        except json.JSONDecodeError:
            continue
    return calls


def strip_tool_calls(text: str) -> str:
    """Supprime les balises d'outils du texte final."""
    return re.sub(r"<outil>.*?</outil>", "", text, flags=re.DOTALL).strip()
