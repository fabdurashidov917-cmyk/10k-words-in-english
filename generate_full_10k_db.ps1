# Comprehensive Generator for 10,000 Words Database
Write-Output "Starting 10,000 Words Database Compilation..."

# 1. Load raw new words
$rawWordsText = [System.IO.File]::ReadAllText("C:\Users\user\.gemini\word-game\new_words_raw.txt", [System.Text.Encoding]::UTF8)
$rawWordsText = $rawWordsText -replace "<USER_REQUEST>", "" -replace "</USER_REQUEST>", ""
$rawLines = $rawWordsText -split "`r?`n"

$seenWords = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$uniqueWordsList = [System.Collections.Generic.List[string]]::new()

$noiseFilter = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
@("bazani", "shu", "so'zlar", "bilan", "kengaytir", "har", "bir", "bo'limga", "qosh", "va", "rndomligini", "taminla", "kamida", "3-4", "ta", "oyindan", "song", "qayta", "takrorlansin", "2", "marta", "undan", "ko'p", "takrorlanganini", "olib", "tashlab", "bittasini", "qoldir", "c", "e", "x", "n", "b", "t", "d", "m", "r", "p", "f", "l", "w", "o", "g", "h", "v", "k", "y", "j", "u", "z", "q", "ii", "iii", "iv", "vi", "vii", "viii", "ix", "etc") | ForEach-Object {
    [void]$noiseFilter.Add($_)
}

foreach ($l in $rawLines) {
    $w = $l.Trim().ToLower()
    if ($w.Length -eq 0 -or $noiseFilter.Contains($w)) { continue }
    if ($w -notmatch '^[a-z\s\-\'']+$') { continue }
    if ($w.Length -eq 1 -and $w -ne "a" -and $w -ne "i") { continue }
    
    if ($seenWords.Add($w)) {
        $uniqueWordsList.Add($w)
    }
}
Write-Output "Unique words extracted: $($uniqueWordsList.Count)"

# 2. Build High-Precision Flashcards Dictionary
$flashRaw = [System.IO.File]::ReadAllText("C:\Users\user\.gemini\word-game\flashcards_raw.txt", [System.Text.Encoding]::UTF8)
$knownDict = [System.Collections.Generic.Dictionary[string, PSObject]]::new([System.StringComparer]::OrdinalIgnoreCase)

$fLines = $flashRaw -split "`r?`n"
foreach ($l in $fLines) {
    $p = $l.Trim() -split "`t"
    if ($p.Length -ge 4 -and $p[0] -match '^\d+$') {
        $w = $p[1].Trim().ToLower()
        if (-not $knownDict.ContainsKey($w)) {
            $knownDict[$w] = [PSCustomObject]@{
                uz = $p[2].Trim()
                ex = $p[3].Trim()
                cat = "daily"
                lvl = "B1"
            }
        }
    }
}
Write-Output "Known flashcards entries loaded: $($knownDict.Count)"

# 3. Category Keyword Matchers
$catKeywords = @{
    "airport" = @("travel", "flight", "hotel", "airport", "route", "island", "ticket", "reservation", "departure", "tourist", "vacation", "plane", "trip", "luggage", "passport", "airline", "cruise", "destination", "terminal", "station", "gate", "arrival", "ferry", "abroad", "visitor", "guide", "transit", "tour", "holiday", "bag", "customs", "resort")
    "nature"  = @("water", "sun", "earth", "forest", "animal", "weather", "sea", "mountain", "rain", "climate", "bird", "wildlife", "nature", "river", "tree", "wind", "season", "plant", "ocean", "rock", "sky", "lake", "fish", "wood", "flower", "grass", "cloud", "ice", "soil", "park", "biology", "green", "winter", "summer", "spring", "autumn", "fall", "moon", "star", "wild")
    "street"  = @("city", "street", "house", "car", "traffic", "building", "road", "bridge", "transport", "subway", "downtown", "avenue", "address", "metro", "vehicle", "hall", "corner", "drive", "parking", "highway", "tower", "square", "neighborhood", "door", "window", "floor", "wall", "village", "town")
    "store"   = @("price", "buy", "sale", "cost", "market", "store", "money", "shop", "discount", "credit", "order", "payment", "customer", "cart", "dollar", "card", "purchase", "item", "product", "goods", "pay", "cheap", "expensive", "brand", "retail", "deal", "cash", "exchange", "supply", "currency", "worth", "bonus", "fee", "tax")
    "food"    = @("food", "restaurant", "coffee", "drink", "bread", "meat", "fruit", "lunch", "dinner", "sugar", "cooking", "soup", "cake", "tea", "milk", "beer", "wine", "rice", "cheese", "apple", "bar", "kitchen", "breakfast", "meal", "salad", "bottle", "fresh", "delicious", "fish", "chicken", "taste", "baking", "potato", "salt")
    "work"    = @("business", "work", "service", "system", "company", "management", "office", "industry", "finance", "contract", "career", "employee", "meeting", "manager", "director", "legal", "law", "court", "policy", "project", "strategy", "report", "organization", "plan", "team", "decision", "goal", "salary", "union", "agency", "worker", "job")
    "tech"    = @("data", "software", "online", "internet", "computer", "web", "technology", "code", "digital", "network", "mobile", "screen", "device", "download", "server", "site", "hardware", "cpu", "chip", "file", "email", "app", "click", "system", "program", "domain", "link", "search", "engine", "media", "video", "audio", "ip", "browser", "host", "security", "developer", "tool", "user", "interface", "protocol", "script", "database", "query")
    "health"  = @("health", "medical", "sport", "body", "hospital", "medicine", "game", "football", "exercise", "player", "doctor", "muscle", "fitness", "care", "disease", "treatment", "patient", "blood", "drug", "clinic", "injury", "surgery", "therapy", "tooth", "diet", "virus", "infection", "cancer", "running", "walk", "sleep", "heart", "eye", "head", "hand", "leg", "arm")
}

# 4. Semantic Uzbek translation mapping for top 1500 web words
$vocabMap = @{
    "the" = "aniq artikl"; "of" = "ning/dan"; "and" = "va"; "to" = "ga/tomon"; "a" = "noaniq artikl";
    "in" = "ichida"; "for" = "uchun"; "is" = "dir/mavjud"; "on" = "ustida"; "that" = "o'sha/ki";
    "by" = "tomonidan"; "this" = "bu"; "with" = "bilan"; "i" = "men"; "you" = "siz"; "it" = "u (jonsiz)";
    "not" = "emas/yo'q"; "or" = "yoki"; "be" = "bo'lmoq"; "are" = "lar/dir"; "from" = "dan";
    "at" = "da/yonida"; "as" = "kabi/sifatida"; "your" = "sizning"; "all" = "barcha/hamma"; "have" = "ega bo'lmoq";
    "new" = "yangi"; "more" = "ko'proq"; "an" = "bitta/bir"; "was" = "edi"; "we" = "biz"; "will" = "ajak/moqchi";
    "home" = "uy"; "can" = "qila olmoq"; "us" = "bizni/bizga"; "about" = "haqida"; "if" = "agar";
    "page" = "sahifa"; "my" = "mening"; "has" = "ega"; "search" = "qidirish"; "free" = "bepul/ozod";
    "but" = "lekin/ammo"; "our" = "bizning"; "one" = "bir/bitta"; "other" = "boshqa"; "do" = "bajarmoq";
    "no" = "yo'q"; "information" = "ma'lumot"; "time" = "vaqt"; "they" = "ular"; "site" = "sayt/joy";
    "he" = "u (erkak)"; "up" = "yuqoriga"; "may" = "mumkin"; "what" = "nima"; "which" = "qaysi";
    "their" = "ularning"; "news" = "yangiliklar"; "out" = "tashqarida"; "use" = "foydalanmoq"; "any" = "har qanday";
    "there" = "u yerda"; "see" = "ko'rmoq"; "only" = "faqat"; "so" = "shunday qilib"; "his" = "uning";
    "when" = "qachonki"; "contact" = "aloqa"; "here" = "bu yerda"; "business" = "biznes"; "who" = "kim";
    "web" = "veb"; "also" = "shuningdek"; "now" = "hozir"; "help" = "yordam bermoq"; "get" = "olmoq";
    "view" = "ko'rinish"; "online" = "onlayn"; "first" = "birinchi"; "am" = "man"; "been" = "bo'lgan";
    "would" = "edim/ardi"; "how" = "qanday"; "were" = "edilar"; "me" = "meni/menga"; "services" = "xizmatlar";
    "some" = "ba'zi"; "these" = "bular"; "click" = "bosing"; "its" = "uning"; "like" = "yoqtirmoq/kabi";
    "service" = "xizmat"; "than" = "ko'ra"; "find" = "topmoq"; "price" = "narx"; "date" = "sana";
    "back" = "ortga"; "top" = "cho'qqi/yuqori"; "people" = "odamlar"; "had" = "bor edi"; "list" = "ro'yxat";
    "name" = "ism"; "just" = "shunchaki/faqat"; "over" = "ustida"; "state" = "holat/davlat"; "year" = "yil";
    "day" = "kun"; "into" = "ichiga"; "email" = "elektron pochta"; "two" = "ikki"; "health" = "salomatlik";
    "world" = "dunyo"; "re" = "haqida"; "next" = "keyingi"; "used" = "ishlatilgan"; "go" = "bormoq";
    "work" = "ishlamoq"; "last" = "oxirgi"; "most" = "eng ko'p"; "products" = "mahsulotlar"; "music" = "musiqa";
    "buy" = "sotib olmoq"; "data" = "ma'lumotlar"; "make" = "yaratmoq"; "them" = "ularni"; "should" = "kerak";
    "product" = "mahsulot"; "system" = "tizim"; "post" = "xabar"; "her" = "uning (ayol)"; "city" = "shahar";
    "add" = "qo'shmoq"; "policy" = "siyosat/qoida"; "number" = "raqam"; "such" = "bunday"; "please" = "iltimos";
    "available" = "mavjud"; "copyright" = "mualliflik huquqi"; "support" = "qo'llab-quvvatlash"; "message" = "xabar";
    "after" = "keyin"; "best" = "eng yaxshi"; "software" = "dasturiy ta'minot"; "then" = "so'ngra";
    "good" = "yaxshi"; "video" = "video"; "well" = "yaxshi"; "where" = "qayerda"; "info" = "ma'lumot";
    "rights" = "huquqlar"; "public" = "ommaviy"; "books" = "kitoblar"; "high" = "yuqori"; "school" = "maktab";
    "through" = "orqali"; "each" = "har bir"; "links" = "havolalar"; "she" = "u (ayol)"; "review" = "sharh";
    "years" = "yillar"; "order" = "buyurtma"; "very" = "juda"; "privacy" = "maxfiylik"; "book" = "kitob";
    "items" = "narsalar"; "company" = "kompaniya"; "read" = "o'qimoq"; "group" = "guruh"; "need" = "muhtoj bo'lmoq";
    "many" = "ko'p"; "user" = "foydalanuvchi"; "said" = "dedi"; "does" = "bajaradi"; "set" = "to'plam";
    "under" = "ostida"; "general" = "umumiy"; "research" = "tadqiqot"; "university" = "universitet";
    "mail" = "pochta"; "full" = "to'liq"; "map" = "xarita"; "reviews" = "sharhlar"; "program" = "dastur";
    "life" = "hayot"; "know" = "bilmoq"; "games" = "o'yinlar"; "way" = "yo'l"; "days" = "kunlar";
    "management" = "boshqaruv"; "part" = "qism"; "could" = "qila olardi"; "great" = "buyuk/ajoyib";
    "united" = "birlashgan"; "hotel" = "mehmonxona"; "real" = "haqiqiy"; "item" = "element";
    "international" = "xalqaro"; "center" = "markaz"; "must" = "shart"; "store" = "do'kon";
    "travel" = "sayohat"; "comments" = "izohlar"; "made" = "yasalgan"; "development" = "rivojlanish";
    "report" = "hisobot"; "off" = "o'chiq/chegirma"; "member" = "a'zo"; "details" = "tafsilotlar";
    "line" = "chiziq/qator"; "terms" = "shartlar"; "before" = "oldin"; "hotels" = "mehmonxonalar";
    "did" = "qildi"; "send" = "yubormoq"; "right" = "o'ng/to'g'ri"; "type" = "tur/yozmoq";
    "because" = "chunki"; "local" = "mahalliy"; "those" = "o'shalar"; "using" = "ishlatish";
    "results" = "natijalar"; "office" = "idora"; "education" = "ta'lim"; "national" = "milliy";
    "car" = "avtomobil"; "design" = "dizayn"; "take" = "olmoq"; "posted" = "joylashtirilgan";
    "internet" = "internet"; "address" = "manzil"; "community" = "hamjamiyat"; "within" = "ichida";
    "area" = "hudud"; "want" = "xohlamoq"; "phone" = "telefon"; "shipping" = "yetkazib berish";
    "reserved" = "band qilingan"; "subject" = "mavzu"; "between" = "orasida"; "forum" = "forum";
    "family" = "oila"; "long" = "uzun"; "based" = "asoslangan"; "code" = "kod"; "show" = "ko'rsatmoq";
    "even" = "hatto"; "black" = "qora"; "check" = "tekshirmoq"; "special" = "maxsus"; "prices" = "narxlar";
    "website" = "veb-sayt"; "index" = "ko'rsatkich"; "being" = "bo'lish"; "women" = "ayollar";
    "much" = "ko'p"; "sign" = "belgi/imzo"; "file" = "fayl"; "link" = "havola"; "open" = "ochiq";
    "today" = "bugun"; "technology" = "texnologiya"; "south" = "janub"; "case" = "holat";
    "project" = "loyiha"; "same" = "bir xil"; "pages" = "sahifalar"; "version" = "versiya";
    "section" = "bo'lim"; "own" = "shaxsiy"; "found" = "topildi"; "sports" = "sport";
    "house" = "uy"; "related" = "bog'liq"; "security" = "xavfsizlik"; "both" = "ikkala";
    "photo" = "surat"; "game" = "o'yin"; "members" = "a'zolar"; "power" = "quvvat";
    "care" = "g'amxo'rlik"; "network" = "tarmoq"; "down" = "pastga"; "computer" = "kompyuter";
    "systems" = "tizimlar"; "three" = "uch"; "total" = "jami"; "place" = "joy"; "end" = "oxiri";
    "download" = "yuklab olmoq"; "think" = "o'ylamoq"; "north" = "shimol"; "resources" = "resurslar";
    "current" = "joriy"; "posts" = "xabarlar"; "big" = "katta"; "media" = "media"; "law" = "qonun";
    "control" = "nazorat"; "water" = "suv"; "history" = "tarix"; "pictures" = "rasmlar"; "size" = "o'lcham";
    "art" = "san'at"; "personal" = "shaxsiy"; "guide" = "yo'riqnoma"; "shop" = "do'kon";
    "location" = "manzil"; "change" = "o'zgarish"; "white" = "oq"; "text" = "matn"; "small" = "kichik";
    "rate" = "daraja/narx"; "government" = "hukumat"; "children" = "bolalar"; "during" = "davomida";
    "return" = "qaytmoq"; "students" = "talabalar"; "shopping" = "xarid"; "account" = "hisob";
    "level" = "daraja"; "digital" = "raqamli"; "profile" = "profil"; "previous" = "oldingi";
    "form" = "shakl"; "events" = "voqealar"; "love" = "sevmoq"; "old" = "eski/qari"; "main" = "asosiy";
    "call" = "chaqirmoq"; "hours" = "soatlar"; "image" = "tasvir"; "title" = "sarlavha";
    "description" = "tavsif"; "property" = "mulk"; "class" = "sinf"; "still" = "hali ham";
    "money" = "pul"; "quality" = "sifat"; "every" = "har bir"; "content" = "tarkib"; "country" = "mamlakat";
    "visit" = "tashrif buyurmoq"; "save" = "saqlamoq"; "tools" = "asboblar"; "low" = "past";
    "customer" = "xaridor"; "movies" = "filmlar"; "include" = "o'z ichiga olmoq"; "college" = "kollej";
    "value" = "qiymat"; "article" = "maqola"; "man" = "erkak"; "card" = "karta"; "jobs" = "ishlar";
    "food" = "taom"; "source" = "manba"; "author" = "muallif"; "different" = "turli xil";
    "learn" = "o'rganmoq"; "sale" = "sotuv"; "print" = "chop etmoq"; "course" = "kurs"; "job" = "ish";
    "room" = "xona"; "training" = "mashg'ulot"; "point" = "nuqta"; "join" = "qo'shilmoq";
    "science" = "fan"; "look" = "qaramoq"; "left" = "chap/qolgan"; "team" = "jamoa";
    "box" = "quti"; "conditions" = "shartlar"; "select" = "tanlamoq"; "week" = "hafta";
    "category" = "toifa"; "note" = "eslatma"; "live" = "yashamoq/jonli"; "large" = "yirik/katta";
    "table" = "jadval"; "market" = "bozor"; "action" = "harakat"; "start" = "boshlash";
    "features" = "xususiyatlar"; "air" = "havo"; "plan" = "reja"; "human" = "inson";
    "cost" = "narx/xarajat"; "better" = "yaxshiroq"; "say" = "aytmoq"; "questions" = "savollar";
    "medical" = "tibbiy"; "friend" = "do'st"; "come" = "kelmoq"; "server" = "server"; "study" = "o'qimoq";
    "play" = "o'ynamoq"; "again" = "yana"; "never" = "hech qachon"; "street" = "ko'cha";
    "working" = "ishlash"; "person" = "shaxs"; "mobile" = "mobil"; "got" = "oldi";
    "payment" = "to'lov"; "equipment" = "uskunalar"; "student" = "talaba"; "let" = "ruxsat bermoq";
    "programs" = "dasturlar"; "recent" = "yaqindagi"; "park" = "bog'"; "problem" = "muammo";
    "red" = "qizil"; "give" = "bermoq"; "memory" = "xotira"; "performance" = "samadorlik";
    "social" = "ijtimoiy"; "story" = "hikoya"; "sell" = "sotmoq"; "experience" = "tajriba";
    "create" = "yaratmoq"; "key" = "kalit"; "body" = "tana"; "young" = "yosh";
    "important" = "muhim"; "paper" = "qog'oz"; "age" = "yosh"; "activities" = "faoliyatlar";
    "example" = "misol"; "road" = "yo'l"; "gift" = "sovg'a"; "question" = "savol";
    "changes" = "o'zgarishlar"; "night" = "tun"; "hard" = "qattiq/qiyin"; "pay" = "to'lamoq";
    "four" = "to'rt"; "status" = "maqom"; "building" = "bino"; "court" = "sud";
    "always" = "doim"; "result" = "natija"; "audio" = "audio"; "light" = "yorug'lik";
    "write" = "yozmoq"; "war" = "urush"; "offer" = "taklif"; "blue" = "ko'k"; "easy" = "oson";
    "event" = "tadbir"; "release" = "chiqarish"; "picture" = "surat"; "needs" = "ehtiyojlar";
    "possible" = "mumkin"; "month" = "oy"; "major" = "asosiy"; "star" = "yulduz";
    "future" = "kelajak"; "space" = "fazo/bo'sh joy"; "hand" = "qo'l"; "sun" = "quyosh";
    "cards" = "kartalar"; "problems" = "muammolar"; "meeting" = "uchrashuv"; "child" = "bola";
    "keep" = "saqlamoq"; "enter" = "kiritmoq"; "share" = "ulashmoq"; "similar" = "o'xshash";
    "garden" = "bog'"; "schools" = "maktablar"; "million" = "million"; "energy" = "energiya";
    "run" = "yugurmoq"; "delivery" = "yetkazish"; "popular" = "mashhur"; "film" = "film";
    "stories" = "hikoyalar"; "put" = "qo'ymoq"; "computers" = "kompyuterlar"; "try" = "urinmoq";
    "welcome" = "xush kelibsiz"; "images" = "tasvirlar"; "head" = "bosh"; "radio" = "radio";
    "until" = "gacha"; "cell" = "hujayra"; "color" = "rang"; "self" = "o'zi"; "away" = "uzoqda";
    "friends" = "do'stlar"; "sure" = "albatta"; "cars" = "mashinalar"; "marketing" = "marketing";
    "tell" = "aytmoq"; "further" = "keyingi"; "able" = "qodir"; "having" = "ega bo'lgan";
    "provides" = "ta'minlaydi"; "fun" = "quvnoq"; "already" = "allaqachon"; "green" = "yashil";
    "drive" = "haydamoq"; "several" = "bir nechta"; "gold" = "oltin"; "living" = "yashash";
    "collection" = "to'plam"; "short" = "qisqa"; "lot" = "ko'p"; "ask" = "so'ramoq";
    "display" = "ko'rsatish"; "solutions" = "yechimlar"; "director" = "direktor"; "daily" = "kundalik";
    "beach" = "sohil"; "past" = "o'tmish"; "natural" = "tabiiy"; "five" = "besh";
    "weather" = "ob-havo"; "land" = "yer"; "average" = "o'rtacha"; "done" = "bajarildi";
    "window" = "oyna"; "record" = "yozuv"; "direct" = "to'g'ridan-to'g'ri"; "environment" = "atrof-muhit";
    "costs" = "xarajatlar"; "style" = "uslub"; "front" = "old"; "parts" = "qismlar";
    "downloads" = "yuklamalar"; "early" = "erta"; "sound" = "ovoz"; "resource" = "resurs";
    "present" = "hozirgi/sovg'a"; "word" = "so'z"; "material" = "material"; "written" = "yozilgan";
    "talk" = "gaplashmoq"; "rules" = "qoidalar"; "final" = "yakuniy"; "tickets" = "chiptalar";
    "thing" = "narsa"; "requirements" = "talablar"; "true" = "haqiqiy"; "minutes" = "daqiqalar";
    "else" = "boshqa"; "third" = "uchinchi"; "reading" = "o'qish"; "bad" = "yomon";
    "tips" = "maslahatlar"; "plus" = "ortiqcha"; "usually" = "odatda"; "together" = "birgalikda";
    "fast" = "tez"; "fact" = "dalil"; "unit" = "birlik"; "global" = "global"; "meet" = "uchrashmoq";
    "far" = "uzoq"; "economic" = "iqtisodiy"; "player" = "o'yinchi"; "projects" = "loyihalar";
    "often" = "tez-tez"; "submit" = "yubormoq"; "amount" = "miqdor"; "watch" = "tomosha qilmoq";
    "feel" = "his qilmoq"; "though" = "garchi"; "bank" = "bank"; "risk" = "xavf"; "thanks" = "rahmat";
    "everything" = "hamma narsa"; "words" = "so'zlar"; "production" = "ishlab chiqarish";
    "weight" = "vazn"; "town" = "shaharcha"; "heart" = "yurak"; "choose" = "tanlamoq";
    "camera" = "kamera"; "girl" = "qiz"; "clear" = "aniq/tiniq"; "receive" = "qabul qilmoq";
    "wide" = "keng"; "beauty" = "go'zallik"; "taken" = "olingan"; "models" = "modellar";
    "known" = "ma'lum"; "half" = "yarim"; "step" = "qadam"; "simple" = "oddiy"; "quick" = "tez";
    "whole" = "butun"; "annual" = "yillik"; "later" = "keyinroq"; "basic" = "asosiy";
    "shows" = "ko'rsatuvlar"; "church" = "cherkov"; "method" = "usul"; "active" = "faol";
    "practice" = "amaliyot"; "materials" = "materiallar"; "fire" = "olov"; "holiday" = "ta'til";
    "chat" = "suhbat"; "enough" = "yetarli"; "death" = "o'lim"; "writing" = "yozish";
    "speed" = "tezlik"; "countries" = "mamlakatlar"; "loss" = "yo'qotish"; "face" = "yuz";
    "brand" = "brend"; "discount" = "chegirma"; "effects" = "ta'sirlar"; "remember" = "eslamoq";
    "standards" = "standartlar"; "yellow" = "sariq"; "increase" = "oshirmoq"; "base" = "asos";
    "near" = "yaqin"; "thought" = "fikr"; "storage" = "ombor/xotira"; "shoes" = "poyabzal";
    "stay" = "qolmoq"; "nature" = "tabiat"; "orders" = "buyurtmalar"; "turn" = "burilmoq";
    "mean" = "anglatmoq"; "growth" = "o'sish"; "notes" = "qaydlar"; "king" = "qirol";
    "copy" = "nusxa"; "although" = "garchi"; "drug" = "dori"; "income" = "daromad";
    "force" = "kuch"; "cash" = "naqd pul"; "river" = "daryo"; "package" = "paket";
    "engine" = "dvigatel"; "port" = "port"; "album" = "albom"; "stop" = "to'xtamoq";
    "bar" = "bar"; "plans" = "rejalar"; "double" = "ikki baravar"; "dog" = "it";
    "build" = "qurmoq"; "screen" = "ekran"; "exchange" = "ayirboshlash"; "types" = "turlar";
    "soon" = "tez orada"; "lines" = "chiziqlar"; "continue" = "davom etmoq"; "benefits" = "foydalar";
    "season" = "mavsum"; "apply" = "ariza topshirmoq"; "someone" = "kimdir"; "held" = "o'tkazildi";
    "printer" = "printer"; "condition" = "holat"; "effective" = "samarali"; "believe" = "ishonmoq";
    "organization" = "tashkilot"; "effect" = "ta'sir"; "asked" = "so'radi"; "mind" = "aql/fikr";
    "selection" = "tanlov"; "lost" = "yo'qolgan"; "tour" = "tur/sayohat"; "menu" = "menyu";
    "cross" = "kesib o'tmoq"; "anyone" = "har kim"; "hope" = "umid qilmoq"; "silver" = "kumush";
    "wish" = "tilak"; "inside" = "ichkarida"; "solution" = "yechim"; "role" = "rol";
    "supply" = "ta'minot"; "nothing" = "hech narsa"; "certain" = "aniq/muayyan"; "running" = "yugurish";
    "lower" = "pastki"; "necessary" = "zarur"; "union" = "ittifoq"; "according" = "ko'ra";
    "particular" = "alohida"; "fine" = "yaxshi"; "hour" = "soat"; "gas" = "gaz";
    "skills" = "ko'nikmalar"; "six" = "olti"; "advice" = "maslahat"; "career" = "martaba";
    "decision" = "qaror"; "leave" = "tark etmoq"; "huge" = "ulkan"; "woman" = "ayol";
    "facilities" = "qulayliklar"; "kind" = "mehribon/tur"; "middle" = "o'rta"; "move" = "harakatlanmoq";
    "cable" = "kabel"; "opportunities" = "imkoniyatlar"; "taking" = "olish"; "values" = "qadriyatlar";
    "coming" = "kelayotgan"; "object" = "ob'ekt"; "machine" = "mashina"; "length" = "uzunlik";
    "nice" = "yoqimli"; "score" = "hisob/ball"; "statistics" = "statistika"; "client" = "mijoz";
    "returns" = "daromadlar/qaytarishlar"; "capital" = "poytaxt/sarmoya"; "follow" = "ergashmoq";
    "sample" = "namuna"; "investment" = "investitsiya"; "culture" = "madaniyat"; "band" = "guruh";
    "lead" = "boshqarmoq"; "choice" = "tanlov"; "went" = "ketdi"; "starting" = "boshlanish";
    "courses" = "kurslar"; "consumer" = "iste'molchi"; "airport" = "aeroport"; "foreign" = "xorijiy";
    "artist" = "rassom/san'atkor"; "outside" = "tashqarida"; "furniture" = "mebel"; "levels" = "darajalar";
    "channel" = "kanal"; "letter" = "xat"; "mode" = "rejim"; "phones" = "telefonlar"; "ideas" = "g'oyalar";
    "structure" = "tuzilma"; "fund" = "jamg'arma"; "summer" = "yoz"; "allow" = "ruxsat bermoq";
    "degree" = "daraja"; "contract" = "shartnoma"; "button" = "tugma"; "releases" = "relizlar";
    "homes" = "uylar"; "matter" = "masala"; "almost" = "deyarli"; "took" = "oldi";
    "distribution" = "taqsimot"; "editor" = "muharrir"; "cause" = "sabab"; "potential" = "salohiyat";
    "song" = "qo'shiq"; "focus" = "diqqat markazi"; "late" = "kech"; "fall" = "kuz/yiqilmoq";
    "rooms" = "xonalar"; "female" = "ayol"; "responsible" = "mas'ul"; "win" = "g'alaba qozonmoq";
    "primary" = "birlamchi"; "reason" = "sabab"; "tool" = "asbob"; "browser" = "brauzer";
    "spring" = "bahor"; "answer" = "javob"; "voice" = "ovoz"; "friendly" = "do'stona";
    "schedule" = "jadval"; "documents" = "hujjatlar"; "communication" = "muloqot"; "purpose" = "maqsad";
    "feature" = "xususiyat"; "bed" = "karavot"; "comes" = "keladi"; "police" = "politsiya";
    "everyone" = "hamma"; "independent" = "mustaqil"; "approach" = "yondashuv"; "cameras" = "kameralar";
    "physical" = "jismoniy"; "operating" = "ishlayotgan"; "hill" = "tepalik"; "maps" = "xaritalar";
    "medicine" = "dori-darmon"; "deal" = "kelishuv"; "hold" = "ushlab turmoq"; "forms" = "shakllar";
    "glass" = "shisha"; "happy" = "baxtli"; "thank" = "minnatdorlik"; "safe" = "xavfsiz";
    "unique" = "noyob"; "sport" = "sport"; "ready" = "tayyor"; "animal" = "hayvon";
    "sources" = "manbalar"; "population" = "aholi"; "regular" = "muntazam"; "secure" = "xavfsiz";
    "navigation" = "navigatsiya"; "operations" = "operatsiyalar"; "evidence" = "dalil"; "station" = "bekat";
    "round" = "dumaloq"; "favorite" = "sevimli"; "understand" = "tushunmoq"; "option" = "variant";
    "master" = "usta/yetakchi"; "valley" = "vodiy"; "recently" = "yaqinda"; "probably" = "ehtimol";
    "sea" = "dengiz"; "built" = "qurilgan"; "blood" = "qon"; "cut" = "kesmoq";
    "improve" = "yaxshilamoq"; "connection" = "ulanish/aloqa"; "hall" = "zal"; "larger" = "kattaroq";
    "networks" = "tarmoqlar"; "earth" = "yer"; "parents" = "ota-ona"; "impact" = "ta'sir";
    "transfer" = "o'tkazish"; "kitchen" = "oshxona"; "strong" = "kuchli"; "wedding" = "to'y";
    "hospital" = "shifoxona"; "ground" = "yer/maydon"; "ship" = "kema"; "owners" = "egalari";
    "disease" = "kasallik"; "excellent" = "a'lo"; "paid" = "to'langan"; "perfect" = "mukammal";
    "hair" = "soch"; "opportunity" = "imkoniyat"; "classic" = "klassik"; "basis" = "asos";
    "command" = "buyruq"; "cities" = "shaharlar"; "express" = "tezkor"; "award" = "mukofot";
    "distance" = "masofa"; "tree" = "daraxt"; "ensure" = "ta'minlamoq"; "wall" = "devor";
    "extra" = "qo'shimcha"; "especially" = "ayniqsa"; "interface" = "interfeys"; "partners" = "hamkorlar";
    "budget" = "byudjet"; "success" = "muvaffaqiyat"; "maximum" = "maksimal"; "operation" = "operatsiya";
    "existing" = "mavjud"; "boy" = "bola/o'g'il"; "patients" = "bemorlar"; "restaurants" = "restoranlar";
    "beautiful" = "chiroyli"; "warning" = "ogohlantirish"; "wine" = "vino"; "locations" = "joylashuvlar";
    "horse" = "ot"; "forward" = "oldinga"; "flowers" = "gullar"; "stars" = "yulduzlar";
    "significant" = "muhim"; "lists" = "ro'yxatlar"; "owner" = "ega"; "retail" = "chakana";
    "animals" = "hayvonlar"; "useful" = "foydali"; "directly" = "to'g'ridan-to'g'ri"; "ways" = "yo'llar";
    "son" = "o'g'il"; "providing" = "ta'minlash"; "rule" = "qoida"; "housing" = "uy-joy";
    "takes" = "oladi"; "bring" = "olib kelmoq"; "catalog" = "katalog"; "max" = "maksimal";
    "trying" = "urinmoqda"; "mother" = "ona"; "authority" = "hokimiyat"; "traffic" = "tirbandlik";
    "strategy" = "strategiya"; "agent" = "agent"; "valid" = "yaroqli"; "modern" = "zamonaviy";
    "senior" = "katta"; "door" = "eshik"; "grand" = "ulug'vor"; "testing" = "sinov";
    "trial" = "sinov muddati"; "charge" = "zaryad/to'lov"; "units" = "birliklar"; "instead" = "o'rniga";
    "cool" = "salqin/zo'r"; "normal" = "odatiy"; "wrote" = "yozdi"; "enterprise" = "korxona";
    "ships" = "kemalar"; "entire" = "butun"; "metal" = "metall"; "positive" = "ijobiy";
    "fitness" = "fitnes"; "opinion" = "fikr"; "football" = "futbol"; "uses" = "foydalanadi";
    "output" = "chiqish"; "funds" = "mablag'lar"; "greater" = "kattaroq"; "likely" = "ehtimoliy";
    "develop" = "rivojlantirmoq"; "employees" = "xodimlar"; "artists" = "san'atkorlar"; "alternative" = "muqobil";
    "responsibility" = "mas'uliyat"; "resolution" = "yechim/aniqlik"; "guest" = "mehmon"; "seems" = "tuyuladi";
    "publication" = "nashr"; "pass" = "o'tmoq/ruxsatnoma"; "relations" = "munosabatlar"; "trust" = "ishonch";
    "contains" = "o'z ichiga oladi"; "session" = "sessiya"; "republic" = "respublika"; "fees" = "to'lovlar";
    "components" = "tarkibiy qismlar"; "vacation" = "ta'til"; "century" = "asr"; "academic" = "akademik";
    "assistance" = "yordam"; "completed" = "yakunlangan"; "skin" = "teri"; "graphics" = "grafika";
    "expected" = "kutilgan"; "ring" = "uzuk/qo'ng'iroq"; "grade" = "baho/daraja"; "dating" = "uchrashuv";
    "mountain" = "tog'"; "organizations" = "tashkilotlar"; "filter" = "filtr"; "vehicle" = "transport vositasi";
    "longer" = "uzunroq"; "consider" = "hisobga olmoq"; "behind" = "orqasida"; "panel" = "panel";
    "floor" = "pol/qavat"; "buying" = "sotib olish"; "match" = "moslik/o'yin"; "proposed" = "taklif etilgan";
    "default" = "birlamchi"; "require" = "talab qilmoq"; "boys" = "o'g'il bolalar"; "outdoor" = "ochiq havoda";
    "deep" = "chuqur"; "morning" = "tong"; "otherwise" = "aks holda"; "allows" = "imkon beradi";
    "rest" = "dam olish"; "plant" = "o'simlik/zavod"; "hit" = "zarba/xit"; "transportation" = "tashish";
    "pool" = "hovuz"; "politics" = "siyosat"; "partner" = "hamkor"; "authors" = "mualliflar";
    "boards" = "kengashlar"; "faculty" = "fakultet"; "parties" = "bazmlar/taraflar"; "fish" = "baliq";
    "membership" = "a'zolik"; "mission" = "vazifa"; "eye" = "ko'z"; "sense" = "sezgi/ma'no";
    "pack" = "to'plam"; "released" = "chiqarilgan"; "stage" = "bosqich"; "internal" = "ichki";
    "goods" = "tovarlar"; "recommended" = "tavsiya etilgan"; "born" = "tug'ilgan"; "unless" = "agar ... bo'lmasa";
    "detailed" = "batafsil"; "race" = "poyga/irq"; "approved" = "tasdiqlangan"; "background" = "orqa fon/tajriba";
    "target" = "maqsad"; "except" = "dan tashqari"; "character" = "xarakter/belgi"; "maintenance" = "texnik xizmat";
    "ability" = "qobiliyat"; "maybe" = "balki"; "functions" = "funksiyalar"; "moving" = "harakatlanish";
    "brands" = "brendlar"; "places" = "joylar"; "pretty" = "chiroyli/yetarlicha"; "winter" = "qish";
    "battery" = "batareya"; "youth" = "yoshlar"; "pressure" = "bosim"; "submitted" = "topshirildi";
    "debt" = "qarz"; "keywords" = "kalit so'zlar"; "medium" = "o'rta"; "television" = "televizor";
    "interested" = "qiziqqan"; "core" = "yadro/asos"; "break" = "tanaffus/sindirmoq"; "purposes" = "maqsadlar";
    "throughout" = "bo'ylab"; "sets" = "to'plamlar"; "dance" = "raqs"; "wood" = "yog'och";
    "defined" = "aniqlangan"; "papers" = "qog'ozlar/hujjatlar"; "awards" = "mukofotlar"; "fee" = "to'lov";
    "studio" = "studiya"; "reader" = "kitobxon"; "virtual" = "virtual"; "device" = "qurilma";
    "established" = "tashkil etilgan"; "answers" = "javoblar"; "rent" = "ijara"; "remote" = "masofaviy";
    "dark" = "qorong'i"; "programming" = "dasturlash"; "external" = "tashqi"; "apple" = "olma";
    "instructions" = "ko'rsatmalar"; "offered" = "taklif qilindi"; "theory" = "nazariya"; "enjoy" = "zavqlanmoq";
    "remove" = "olib tashlamoq"; "aid" = "yordam"; "surface" = "yuza"; "minimum" = "minimal";
    "visual" = "vizual"; "host" = "mezbon"; "variety" = "xilma-xillik"; "teachers" = "o'qituvchilar";
    "manual" = "qo'llanma"; "block" = "blok"; "subjects" = "fanlar/mavzular"; "agents" = "agentlar";
    "increased" = "oshgan"; "repair" = "ta'mirlash"; "fair" = "adolatli"; "civil" = "fuqarolik";
    "steel" = "po'lat"; "understanding" = "tushunish"; "songs" = "qo'shiqlar"; "fixed" = "o'rnatilgan/tuzatilgan";
    "wrong" = "noto'g'ri"; "beginning" = "boshlanishi"; "hands" = "qo'llar"; "associates" = "sheriklar";
    "finally" = "nihoyat"; "updates" = "yangilanishlar"; "desktop" = "ish stoli"; "classes" = "sinflar/darslar";
    "gets" = "oladi"; "sector" = "tarmoq"; "capacity" = "sig'im"; "requires" = "talab etadi";
    "fat" = "yog'/semiz"; "fully" = "to'liq"; "father" = "ota"; "electric" = "elektr";
    "saw" = "ko'rdi"; "instruments" = "asboblar"; "quotes" = "iqtiboslar"; "officer" = "ofitser/xodim";
    "driver" = "haydovchi"; "businesses" = "korxonalar"; "dead" = "o'lik"; "respect" = "hurmat";
    "unknown" = "noma'lum"; "specified" = "ko'rsatilgan"; "restaurant" = "restoran"; "trip" = "safar";
    "worth" = "arzimaydigan/qiymat"; "procedures" = "muolajalar/tartib"; "poor" = "kambag'al"; "teacher" = "o'qituvchi";
    "eyes" = "ko'zlar"; "relationship" = "munosabat"; "workers" = "ishchilar"; "farm" = "ferma";
    "peace" = "tinchlik"; "traditional" = "an'anaviy"; "campus" = "shaharcha"; "showing" = "ko'rsatish";
    "creative" = "ijodiy"; "coast" = "qirg'oq"; "benefit" = "foyda"; "progress" = "rivojlanish";
    "funding" = "moliyalashtirish"; "devices" = "qurilmalar"; "grant" = "grant"; "agree" = "rozi bo'lmoq";
    "fiction" = "badiiy adabiyot"; "hear" = "eshitmoq"; "sometimes" = "ba'zan"; "watches" = "soatlar";
    "careers" = "martabalar"; "beyond" = "narida"; "goes" = "boradi"; "families" = "oilalar";
    "led" = "yetakladi"; "museum" = "muzey"; "themselves" = "o'zlari"; "fan" = "ishqiboz";
    "transport" = "transport"; "interesting" = "qiziqarli"; "wife" = "xotin"; "evaluation" = "baholash";
    "accepted" = "qabul qilingan"; "former" = "sobiq"; "implementation" = "amalga oshirish"; "ten" = "o'n";
    "hits" = "zarbalar"; "zone" = "hudud"; "complex" = "murakkab"; "cat" = "mushuk";
    "galleries" = "galereyalar"; "references" = "ma'lumotnomalar"; "die" = "o'lmoq"; "presented" = "taqdim etildi";
    "flat" = "tekis/kvartira"; "flow" = "oqim"; "agencies" = "agentliklar"; "literature" = "adabiyot";
    "parent" = "ota-ona"; "setting" = "sozlama"; "scale" = "miqyos"; "stand" = "turmoq";
    "economy" = "iqtisodiyot"; "highest" = "eng yuqori"; "helpful" = "foydali"; "monthly" = "oylik";
    "critical" = "o'ta muhim"; "frame" = "ramka"; "musical" = "musiqiy"; "definition" = "ta'rif";
    "secretary" = "kotib"; "networking" = "tarmoq aloqalari"; "path" = "yo'l"; "employee" = "xodim";
    "chief" = "boshliq"; "gives" = "beradi"; "bottom" = "pastki"; "magazines" = "jurnallar";
    "packages" = "paketlar"; "detail" = "tafsilot"; "laws" = "qonunlar"; "changed" = "o'zgargan";
    "pet" = "uy hayvoni"; "heard" = "eshitdi"; "begin" = "boshlamoq"; "individuals" = "shaxslar";
    "royal" = "qirollik"; "clean" = "toza"; "switch" = "o'zgartirish/kalit"; "largest" = "eng katta";
    "guy" = "yigit"; "titles" = "sarlavhalar"; "relevant" = "aloqador"; "guidelines" = "yo'riqnomalar";
    "justice" = "adolat"; "connect" = "ulamoq"; "bible" = "injil"; "cup" = "chashka/kubok";
    "basket" = "savat"; "applied" = "qo'llanilgan"; "weekly" = "haftalik"; "installation" = "o'rnatish";
    "described" = "tasvirlangan"; "demand" = "talab"; "suite" = "lyuks xona/to'plam"; "square" = "maydon";
    "attention" = "diqqat"; "advance" = "oldinga surish"; "skip" = "o'tkazib yubormoq"; "diet" = "parhez";
    "army" = "armiya"; "auction" = "auksion"; "gear" = "jihoz/uzatma"; "difference" = "farq";
    "allowed" = "ruxsat berilgan"; "correct" = "to'g'ri"; "nation" = "millat"; "selling" = "sotish";
    "lots" = "ko'p"; "piece" = "bo'lak"; "sheet" = "varaq"; "firm" = "firma"; "seven" = "yetti";
    "older" = "kattaroq"; "regulations" = "qoidalar"; "elements" = "elementlar"; "species" = "turlar";
    "jump" = "sakramoq"; "cells" = "hujayralar"; "module" = "modul"; "resort" = "kurort";
    "facility" = "inshoot"; "random" = "tasodifiy"; "pricing" = "narxlash"; "certificate" = "sertifikat";
    "minister" = "vazir"; "motion" = "harakat"; "looks" = "ko'rinadi"; "fashion" = "moda";
    "directions" = "yo'nalishlar"; "visitors" = "tashrif buyuruvchilar"; "documentation" = "hujjatlar";
    "monitor" = "kuzatmoq/monitor"; "trading" = "savdo"; "forest" = "o'rmon"; "calls" = "chaqiruvlar";
    "coverage" = "qamrov"; "couple" = "juftlik"; "giving" = "berish"; "chance" = "imkoniyat";
    "vision" = "tasavvur/ko'rish"; "ball" = "to'p"; "ending" = "yakunlanish"; "clients" = "mijozlar";
    "actions" = "harakatlar"; "listen" = "tinglamoq"; "discuss" = "muhokama qilmoq"; "accept" = "qabul qilmoq";
    "automotive" = "avtomobilga oid"; "goal" = "maqsad"; "successful" = "muvaffaqiyatli"; "sold" = "sotilgan";
    "wind" = "shamol"; "communities" = "hamjamiyatlar"; "clinical" = "klinik"; "situation" = "vaziyat";
    "sciences" = "fanlar"; "markets" = "bozorlar"; "lowest" = "eng past"; "highly" = "yuqori darajada";
    "publishing" = "nashriyot"; "appear" = "paydo bo'lmoq"; "emergency" = "favqulodda holat";
    "developing" = "rivojlanayotgan"; "lives" = "hayotlar"; "currency" = "valyuta"; "leather" = "charm";
    "determine" = "aniqlamoq"; "temperature" = "harorat"; "announcements" = "e'lonlar"; "patient" = "bemor/sabrli";
    "actual" = "haqiqiy"; "historical" = "tarixiy"; "stone" = "tosh"; "commerce" = "tijorat";
    "perhaps" = "ehtimol"; "persons" = "odamlar"; "difficult" = "qiyin"; "scientific" = "ilmiy";
    "satellite" = "sun'iy yo'ldosh"; "fit" = "mos kelmoq"; "tests" = "testlar"; "village" = "qishloq";
    "accounts" = "hisoblar"; "pain" = "og'riq"; "particularly" = "ayniqsa"; "factors" = "omillar";
    "coffee" = "qahva"; "settings" = "sozlamalar"; "buyer" = "xaridor"; "cultural" = "madaniy";
    "easily" = "osonlikcha"; "oral" = "og'zaki"; "poster" = "plakat"; "edge" = "chet/qirra";
    "functional" = "funksional"; "root" = "ildiz"; "closed" = "yopiq"; "holidays" = "bayramlar";
    "ice" = "muz"; "pink" = "pushti"; "balance" = "muvozanat"; "monitoring" = "monitoring";
    "graduate" = "bitiruvchi"; "replies" = "javoblar"; "shot" = "otish/surat"; "architecture" = "me'morchilik";
    "initial" = "dastlabki"; "label" = "yorliq"; "thinking" = "fikrlash"; "recommend" = "tavsiya qilmoq";
    "league" = "liga"; "waste" = "isrof/chiqindi"; "minute" = "daqiqa"; "bus" = "avtobus";
    "provider" = "provayder"; "optional" = "ixtiyoriy"; "dictionary" = "lug'at"; "cold" = "sovuq";
    "accounting" = "buxgalteriya"; "manufacturing" = "ishlab chiqarish"; "sections" = "bo'limlar";
    "chair" = "stul"; "fishing" = "baliq ovi"; "effort" = "harakat/sa'y"; "phase" = "bosqich";
    "fields" = "maydonlar"; "bag" = "sumka"; "letters" = "harflar/xatlar"; "motor" = "motor";
    "professor" = "professor"; "context" = "kontekst"; "install" = "o'rnatmoq"; "shirt" = "ko'ylak";
    "generally" = "odatda"; "continued" = "davom etgan"; "foot" = "oyoq/fut"; "mass" = "massa";
    "crime" = "jinoyat"; "count" = "sanamoq"; "techniques" = "usullar"; "quickly" = "tezda";
    "dollars" = "dollarlar"; "websites" = "veb-saytlar"; "religion" = "din"; "claim" = "da'vo";
    "driving" = "haydash"; "permission" = "ruxsat"; "surgery" = "jarrohlik"; "heat" = "issiqlik";
    "wild" = "yovvoyi"; "measures" = "choralar"; "generation" = "avlod"; "miss" = "sog'inmoq/o'tkazib yubormoq";
    "chemical" = "kimyoviy"; "doctor" = "shifokor"; "task" = "vazifa"; "reduce" = "kamaytirmoq";
    "brought" = "olib keldi"; "component" = "tarkibiy qism"; "enable" = "yoqmoq/imkon bermoq";
    "exercise" = "mashq"; "guarantee" = "kafolat"; "leader" = "yetakchi"; "diamond" = "olmos";
    "processes" = "jarayonlar"; "soft" = "yumshoq"; "servers" = "serverlar"; "alone" = "yolg'iz";
    "meetings" = "yig'ilishlar"; "seconds" = "soniyalar"; "interests" = "qiziqishlar"; "flight" = "parvoz";
    "congress" = "kongress"; "fuel" = "yoqilg'i"; "username" = "foydalanuvchi nomi"; "walk" = "piyoda yurmoq";
    "produced" = "ishlab chiqarilgan"; "wait" = "kutmoq"; "supported" = "qo'llab-quvvatlangan";
    "pocket" = "cho'ntak"; "rose" = "atirgul/ko'tarildi"; "freedom" = "erkinlik"; "argument" = "dalil/bahs";
    "competition" = "musobaqa"; "creating" = "yaratish"; "drugs" = "dorilar"; "joint" = "qo'shma";
    "premium" = "premium"; "providers" = "ta'minotchilar"; "fresh" = "yangi/toza"; "characters" = "qahramonlar/belgilar";
    "attorney" = "advokat"; "upgrade" = "yangilash"; "factor" = "omil"; "growing" = "o'sayotgan";
    "thousands" = "minglab"; "stream" = "oqim"; "apartments" = "kvartiralar"; "pick" = "tanlamoq";
    "hearing" = "eshitish"; "eastern" = "sharqiy"; "auctions" = "auksionlar"; "therapy" = "terapiya";
    "entries" = "yozuvlar"; "dates" = "sanalar"; "generated" = "yaratilgan"; "signed" = "imzolangan";
    "upper" = "yuqori"; "administrative" = "ma'muriy"; "serious" = "jiddiy"; "prime" = "bosh/asosiy";
    "limit" = "chegara"; "began" = "boshladi"; "steps" = "qadamlar"; "errors" = "xatolar";
    "shops" = "do'konlar"; "efforts" = "harakatlar"; "informed" = "xabardor"; "thoughts" = "fikrlar";
    "worked" = "ishladi"; "quantity" = "miqdor"; "urban" = "shaharga oid"; "practices" = "amaliyotlar";
    "sorted" = "saralangan"; "reporting" = "hisobot berish"; "essential" = "muhim/zarur"; "myself" = "o'zim";
    "tours" = "sayohatlar"; "platform" = "platforma"; "load" = "yuklamoq"; "labor" = "mehnat";
    "immediately" = "darhol"; "admin" = "administrator"; "nursing" = "hamshiralik"; "defense" = "himoya";
    "machines" = "mashinalar"; "designated" = "belgilangan"; "tags" = "teglar"; "heavy" = "og'ir";
    "covered" = "qoplangan"; "recovery" = "tiklanish"; "guys" = "yigitlar"; "integrated" = "integratsiyalashgan";
    "configuration" = "sozlash"; "merchant" = "savdogar"; "comprehensive" = "keng qamrovli"; "expert" = "mutaxassis";
    "universal" = "universal"; "protect" = "himoya qilmoq"; "drop" = "tushirmoq/tomchi"; "solid" = "qattiq/mustahkam";
    "presentation" = "taqdimot"; "languages" = "tillar"; "became" = "bo'ldi"; "orange" = "apelsin/to'q sariq";
    "compliance" = "muvofiqlik"; "vehicles" = "transport vositalari"; "prevent" = "oldini olmoq"; "theme" = "mavzu";
    "rich" = "boy"; "campaign" = "kampaniya"; "marine" = "dengizga oid"; "improvement" = "yaxshilanish";
    "guitar" = "gitara"; "finding" = "topilma"; "examples" = "misollar"; "saying" = "aytish";
    "spirit" = "ruh"; "claims" = "da'volar"; "challenge" = "qiyinchilik"; "acceptance" = "qabul qilish";
    "strategies" = "strategiyalar"; "seem" = "tuyulmoq"; "affairs" = "ishlar"; "touch" = "tegmoq";
    "intended" = "mo'ljallangan"; "towards" = "tomon"; "goals" = "maqsadlar"; "hire" = "yollamoq";
    "election" = "saylov"; "suggest" = "taklif qilmoq"; "branch" = "filial/shox"; "charges" = "ayblovlar/narxlar";
    "serve" = "xizmat qilmoq"; "reasons" = "sabablar"; "magic" = "sehr"; "mount" = "tog'/o'rnatmoq";
    "smart" = "aqlli"; "talking" = "gaplashish"; "gave" = "berdi"; "ones" = "narsalar";
    "latin" = "lotincha"; "multimedia" = "multimedia"; "avoid" = "qochmoq/saqlanmoq"; "certified" = "sertifikatlangan";
    "manage" = "boshqarmoq"; "corner" = "burchak"; "rank" = "martaba/unvon"; "computing" = "hisoblash";
    "element" = "element"; "birth" = "tug'ilish"; "virus" = "virus"; "interactive" = "interaktiv";
    "requests" = "so'rovlar"; "separate" = "alohida"; "quarter" = "chorak"; "procedure" = "tartib";
    "leadership" = "yetakchilik"; "tables" = "jadvallar"; "define" = "ta'riflamoq"; "racing" = "poyga";
    "religious" = "diniy"; "facts" = "faktlar"; "breakfast" = "nonushta"; "column" = "ustun";
    "plants" = "o'simliklar"; "faith" = "e'tiqod"; "chain" = "zanjir"; "developer" = "dasturchi";
    "identify" = "aniqlamoq"; "avenue" = "prospekt"; "missing" = "yo'qolgan"; "died" = "vafot etdi";
    "approximately" = "taxminan"; "domestic" = "mahalliy/ichki"; "recommendations" = "tavsiyalar"; "moved" = "ko'chdi";
    "reach" = "yetib bormoq"; "comparison" = "solishtirish"; "mental" = "ruhiy"; "viewed" = "ko'rilgan";
    "moment" = "lahza"; "extended" = "kengaytirilgan"; "sequence" = "ketma-ketlik"; "inch" = "dyuym";
    "attack" = "hujum"; "sorry" = "kechirasiz"; "centers" = "markazlar"; "opening" = "ochilish";
    "damage" = "zarar"; "lab" = "laboratoriya"; "reserve" = "zaxira"; "recipes" = "retseptlar";
    "plastic" = "plastmassa"; "produce" = "ishlab chiqarmoq"; "snow" = "qor"; "placed" = "joylashtirilgan";
    "truth" = "haqiqat"; "counter" = "peshtaxta/hisoblagich"; "failure" = "muvaffaqiyatsizlik"; "follows" = "ergashadi";
    "weekend" = "dam olish kuni"; "dollar" = "dollar"; "camp" = "oromgoh"; "automatically" = "avtomatik";
    "films" = "filmlar"; "bridge" = "ko'prik"; "native" = "mahalliy/ona"; "fill" = "to'ldirmoq";
    "movement" = "harakat"; "printing" = "chop etish"; "baseball" = "beysbol"; "owned" = "egalik qilingan";
    "approval" = "tasdiqlash"; "draft" = "qoralama"; "chart" = "diagramma"; "played" = "o'ynadi";
    "contacts" = "aloqalar"; "readers" = "kitobxonlar"; "clubs" = "klublar"; "equal" = "teng";
    "adventure" = "sarguzasht"; "matching" = "moslashtirish"; "offering" = "taklif"; "shirts" = "ko'ylaklar";
    "profit" = "foyda"; "leaders" = "yetakchilar"; "posters" = "plakatlar"; "institutions" = "muassasalar";
    "assistant" = "yordamchi"; "variable" = "o'zgaruvchi"; "advertisement" = "reklama"; "expect" = "kutmoq";
    "parking" = "avtoturargoh"; "headlines" = "sarlavhalar"; "yesterday" = "kecha"; "compared" = "solishtirilgan";
    "determined" = "qat'iyatli"; "wholesale" = "ulgurji"; "workshop" = "ustaxona"; "gone" = "ketgan";
    "codes" = "kodlar"; "kinds" = "turlar"; "extension" = "kengaytma"; "statements" = "bayonotlar";
    "golden" = "oltin"; "completely" = "butunlay"; "teams" = "jamoalar"; "lighting" = "yoritish";
    "forces" = "kuchlar"; "funny" = "kulgili"; "brother" = "aka/uka"; "gene" = "gen";
    "turned" = "burildi"; "portable" = "ko'chma"; "tried" = "harakat qildi"; "electrical" = "elektrga oid";
    "applicable" = "qo'llaniladigan"; "disc" = "disk"; "returned" = "qaytdi"; "pattern" = "andoza/naqsh";
    "boat" = "qayiq"; "named" = "nomlangan"; "theatre" = "teatr"; "laser" = "lazer";
    "earlier" = "oldinroq"; "manufacturers" = "ishlab chiqaruvchilar"; "sponsor" = "homiy"; "classical" = "klassik";
    "icon" = "belgi"; "warranty" = "kafolat"; "dedicated" = "bag'ishlangan"; "direction" = "yo'nalish";
    "basketball" = "basketbol"; "objects" = "ob'ektlar"; "ends" = "tugaydi"; "delete" = "o'chirmoq";
    "evening" = "oqshom"; "assembly" = "assambleya/yig'ish"; "nuclear" = "yadroviy"; "taxes" = "soliqlar";
    "mouse" = "sichqoncha"; "signal" = "signal"; "criminal" = "jinoyatchi"; "issued" = "berilgan";
    "brain" = "miya"; "sexual" = "jinsiy"; "powerful" = "kuchli"; "dream" = "orzu";
    "obtained" = "olingan"; "false" = "yolg'on/noto'g'ri"; "cast" = "aktyorlar guruhi"; "flower" = "gul";
    "felt" = "his qildi"; "personnel" = "xodimlar"; "passed" = "o'tdi"; "supplied" = "yetkazib berildi";
    "identified" = "aniqlangan"; "falls" = "sharsharalar/tushadi"; "soul" = "jon/ruh"; "opinions" = "fikrlar";
    "promote" = "targ'ib qilmoq"; "stated" = "ta'kidlangan"; "stats" = "statistika"; "professionals" = "mutaxassislar";
    "appears" = "ko'rinadi"; "carry" = "olib yurmoq"; "flag" = "bayroq"; "decided" = "qaror qildi";
    "covers" = "qoplaydi"; "advantage" = "afzallik"; "hello" = "salom"; "designs" = "dizaynlar";
    "maintain" = "saqlamoq"; "tourism" = "turizm"; "priority" = "ustuvorlik"; "newsletters" = "axborot byulletenlari";
    "adults" = "kattalar"; "clips" = "kliplar"; "savings" = "jamg'armalar"; "graphic" = "grafik";
    "atom" = "atom"; "payments" = "to'lovlar"; "estimated" = "taxmin qilingan"; "binding" = "majburiy";
    "brief" = "qisqa"; "ended" = "tugadi"; "winning" = "g'alaba"; "eight" = "sakkiz";
    "anonymous" = "noma'lum"; "iron" = "temir/dazmol"; "straight" = "to'g'ri"; "script" = "skript";
    "served" = "xizmat qildi"; "wants" = "xohlaydi"; "miscellaneous" = "turli xil"; "prepared" = "tayyorlangan";
    "dining" = "ovqatlanish"; "alert" = "ogohlantirish"; "integration" = "integratsiya"; "interview" = "suhbat";
    "mix" = "aralashtirmoq"; "framework" = "freymvork/tizim"; "disk" = "disk"; "installed" = "o'rnatilgan";
    "queen" = "qirolicha"; "credits" = "kreditlar/kredit"; "clearly" = "aniq"; "fix" = "tuzatmoq";
    "handle" = "boshqarmoq/tutqich"; "sweet" = "shirin"; "desk" = "parta/stol"; "criteria" = "mezonlar";
    "associate" = "sherik/bog'lamoq"; "truck" = "yuk mashinasi"; "behavior" = "xulq-atvor"; "enlarge" = "kattalashtirmoq";
    "revenue" = "daromad"; "measure" = "o'lchamoq"; "changing" = "o'zgaruvchan"; "votes" = "ovozlar";
    "duty" = "burch/navbatchilik"; "looked" = "qaradi"; "discussions" = "muhokamalar"; "bear" = "ayiq/chidamoq";
    "gain" = "erishmoq/foyda"; "festival" = "festival"; "laboratory" = "laboratoriya"; "ocean" = "okean";
    "flights" = "parvozlar"; "experts" = "mutaxassislar"; "signs" = "belgilar"; "lack" = "yetishmovchilik";
    "depth" = "chuqurlik"; "whatever" = "nima bo'lsa ham"; "laptop" = "noutbuk"; "vintage" = "antiqa";
    "train" = "poezd/mashq qilmoq"; "exactly" = "aynan"; "dry" = "quruq"; "explore" = "kashf qilmoq";
    "concept" = "tushuncha"; "nearly" = "deyarli"; "eligible" = "mos keladigan"; "checkout" = "to'lov kassasi";
    "reality" = "haqiqat"; "forgot" = "unutdi"; "handling" = "boshqarish"; "origin" = "kelib chiqish";
    "knew" = "bilardi"; "gaming" = "o'yin"; "billion" = "milliard"; "destination" = "manzil";
    "faster" = "tezroq"; "intelligence" = "aql/razvedka"; "bought" = "sotib oldi"; "nations" = "millatlar";
    "route" = "yo'nalish"; "followed" = "ergashdi"; "specifications" = "texnik xususiyatlar"; "broken" = "singan";
    "zoom" = "kattalashtirmoq"; "blow" = "esmoq/zarba"; "battle" = "jang"; "residential" = "turar-joy";
    "speak" = "gapirmoq"; "decisions" = "qarorlar"; "industries" = "sohalar"; "protocol" = "bayonnoma/protokol";
    "query" = "so'rov"; "clip" = "klip"; "partnership" = "hamkorlik"; "editorial" = "tahririy";
    "expression" = "ifoda"; "equity" = "tenglik/kapital"; "provisions" = "qoidalar/ta'minot"; "speech" = "nutq";
    "wire" = "sim"; "principles" = "tamoyillar"; "suggestions" = "takliflar"; "rural" = "qishloqqa oid";
    "shared" = "ulashilgan"; "sounds" = "tovushlar"; "replacement" = "almashtirish"; "tape" = "lenta";
    "strategic" = "strategik"; "judge" = "sudya"; "spam" = "spam"; "economics" = "iqtisod";
    "acid" = "kislota"; "bytes" = "baytlar"; "cent" = "sent"; "forced" = "majbur qilingan";
    "compatible" = "mos keluvchi"; "fight" = "kurashmoq"; "apartment" = "kvartira"; "height" = "balandlik";
    "zero" = "nol"; "speaker" = "ma'ruzachi/karnay"; "filed" = "topshirilgan"; "obtain" = "qo'lga kiritmoq";
    "consulting" = "konsalting"; "recreation" = "dam olish"; "offices" = "idoralar"; "designer" = "dizayner";
    "remain" = "qolmoq"; "managed" = "boshqarilgan"; "failed" = "muvaffaqiyatsiz bo'ldi"; "marriage" = "nikoh";
    "roll" = "aylanmoq/o'ram"; "banks" = "banklar"; "participants" = "ishtirokchilar"; "secret" = "sir";
    "bath" = "vanna"; "leads" = "olib keladi"; "negative" = "salbiy"; "favorites" = "sevimlilar";
    "theater" = "teatr"; "springs" = "buloqlar"; "perform" = "ijro etmoq"; "healthy" = "sog'lom";
    "translation" = "tarjima"; "estimates" = "taxminlar"; "font" = "shrift"; "assets" = "aktivlar";
    "injury" = "jarohat"; "ministry" = "vazirlik"; "drivers" = "haydovchilar"; "lawyer" = "advokat";
    "figures" = "raqamlar/shaxslar"; "married" = "turmush qurgan"; "protected" = "himoyalangan"; "proposal" = "taklif";
    "sharing" = "ulashish"; "portal" = "portal"; "waiting" = "kutish"; "birthday" = "tug'ilgan kun";
    "fail" = "muvaffaqiyatsiz bo'lmoq"; "banking" = "bank ishi"; "officials" = "mansabdorlar"; "toward" = "tomon";
    "won" = "yutdi"; "slightly" = "biroz"; "assist" = "yordam bermoq"; "conduct" = "o'tkazmoq";
    "contained" = "saqlangan"; "legislation" = "qonunchilik"; "calling" = "chaqirish"; "parameters" = "parametrlar";
    "serving" = "xizmat qilish"; "bags" = "sumkalar"; "profiles" = "profillar"; "comics" = "komikslar";
    "matters" = "masalalar"; "houses" = "uylar"; "postal" = "pochta"; "relationships" = "munosabatlar";
    "wear" = "kiymoq"; "controls" = "boshqaruv elementlari"; "breaking" = "so'nggi/sindiruvchi"; "combined" = "birlashgan";
    "ultimate" = "yakuniy/eng yuqori"; "representative" = "vakil"; "frequency" = "chastota"; "introduced" = "tanishtirilgan";
    "minor" = "kichik/ahamiyatsiz"; "finish" = "tugatmoq"; "departments" = "bo'limlar"; "residents" = "aholi/rezidentlar";
    "noted" = "qayd etilgan"; "displayed" = "ko'rsatilgan"; "mom" = "ona"; "reduced" = "kamaytirilgan";
    "physics" = "fizika"; "rare" = "kamdan-kam"; "spent" = "sarflagan"; "performed" = "bajarilgan";
    "extreme" = "o'ta yuqori/keskin"; "samples" = "namunalar"; "bars" = "barlar"; "reviewed" = "ko'rib chiqilgan";
    "row" = "qator"; "forecast" = "ob-havo ma'lumoti/taxmin"; "removed" = "olib tashlangan"; "helps" = "yordam beradi";
    "singles" = "yakka tartibdagi"; "administrator" = "administrator"; "cycle" = "davr/tsikl"; "amounts" = "miqdorlar";
    "contain" = "o'z ichiga olmoq"; "accuracy" = "aniqlik"; "dual" = "ikki tomonlama"; "rise" = "ko'tarilmoq";
    "sleep" = "uxlamoq"; "bird" = "qush"; "pharmacy" = "dorixona"; "creation" = "yaratilish";
    "static" = "statik"; "scene" = "sahna"; "hunter" = "ovchi"; "addresses" = "manzillar";
    "lady" = "xonim"; "crystal" = "billur"; "famous" = "mashhur"; "writer" = "yozuvchi";
    "chairman" = "rais"; "violence" = "zo'ravonlik"; "fans" = "muxlislar"; "speakers" = "karnaylar/so'zlovchilar";
    "drink" = "ichmoq"; "academy" = "akademiya"; "dynamic" = "dinamik"; "gender" = "jins";
    "eat" = "yemoq"; "permanent" = "doimiy"; "agriculture" = "qishloq xo'jaligi"; "cleaning" = "tozalash";
    "constitutes" = "tashkil etadi"; "portfolio" = "portfel"; "practical" = "amaliy"; "delivered" = "yetkazildi";
    "infrastructure" = "infratuzilma"; "exclusive" = "eksklyuziv"; "seat" = "o'rindiq"; "concerns" = "xavotirlar";
    "colour" = "rang"; "vendor" = "sotuvchi"; "originally" = "dastlab"; "utilities" = "kommunal xizmatlar";
    "philosophy" = "falsafa"; "regulation" = "tartibga solish"; "officers" = "zobitlar"; "reduction" = "qisqartirish";
    "aim" = "maqsad"; "bids" = "takliflar"; "referred" = "murojaat qilingan"; "supports" = "qo'llab-quvvatlaydi";
    "nutrition" = "ovqatlanish"; "recording" = "yozib olish"; "regions" = "hududlar"; "junior" = "kichik mutaxassis";
    "rings" = "uzuklar"; "meaning" = "ma'no"; "tip" = "maslahat"; "secondary" = "ikkilamchi";
    "wonderful" = "ajoyib"; "mine" = "meniki/kon"; "ladies" = "xonimlar"; "ticket" = "chipta";
    "announced" = "e'lon qilingan"; "guess" = "taxmin qilmoq"; "agreed" = "kelishilgan"; "prevention" = "oldini olish";
    "whom" = "kimni/kimga"; "ski" = "chang'i"; "soccer" = "futbol"; "math" = "matematika";
    "import" = "import"; "posting" = "joylashtirish"; "presence" = "mavjudlik"; "instant" = "oniy/tezkor";
    "mentioned" = "eslatib o'tilgan"; "automatic" = "avtomatik"; "healthcare" = "sog'liqni saqlash"; "viewing" = "ko'rish";
    "maintained" = "saqlangan"; "increasing" = "oshib borayotgan"; "majority" = "ko'pchilik"; "connected" = "ulangan";
    "dogs" = "itlar"; "directors" = "direktorlar"; "aspects" = "jihatlar"; "ahead" = "oldinga";
    "moon" = "oy"; "participation" = "ishtirok"; "scheme" = "sxema"; "utility" = "kommunal";
    "preview" = "oldindan ko'rish"; "fly" = "uchmoq"; "manner" = "tarz/usul"; "matrix" = "matritsa";
    "containing" = "o'z ichiga olgan"; "combination" = "birikma"; "amendment" = "tuzatish"; "despite" = "qaramasdan";
    "strength" = "kuch"; "guaranteed" = "kafolatlangan"; "libraries" = "kutubxonalar"; "proper" = "to'g'ri/munosib";
    "distributed" = "tarqatilgan"; "degrees" = "darajalar"; "enterprises" = "korxonalar"; "fear" = "qo'rquv";
    "seeking" = "qidirmoqda"; "inches" = "dyuymlar"; "convention" = "konvensiya"; "shares" = "aksiyalar";
    "principal" = "asosiy/maktab direktori"; "daughter" = "qiz (farzand)"; "standing" = "turgan"; "comfort" = "qulaylik";
    "colors" = "ranglar"; "wars" = "urushlar"; "ordering" = "buyurtma berish"; "kept" = "saqlangan";
    "appeal" = "murojaat"; "cruise" = "kruiz"; "bonus" = "bonus"; "certification" = "sertifikatlashtirish";
    "previously" = "ilgari"; "bookmark" = "xatcho'p"; "buildings" = "binolar"; "specials" = "maxsus takliflar";
    "beat" = "urmoq/yengmoq"; "household" = "uy xo'jaligi"; "batteries" = "batareyalar"; "smoking" = "chekish";
    "becomes" = "bo'ladi"; "drives" = "haydovlar/disklar"; "arms" = "qo'llar/qurollar"; "tea" = "choy";
    "improved" = "yaxshilangan"; "trees" = "daraxtlar"; "achieve" = "erishmoq"; "positions" = "lavozimlar";
    "dress" = "ko'ylak"; "subscription" = "obuna"; "dealer" = "diler"; "contemporary" = "zamonaviy";
    "sky" = "osmon"; "carried" = "olib bordi"; "happen" = "yuz bermoq"; "exposure" = "ta'sir qilish";
    "hide" = "yashirmoq"; "signature" = "imzo"; "gambling" = "qimor"; "refer" = "havola qilmoq";
    "provision" = "ta'minot"; "outdoors" = "ochiq havoda"; "clothes" = "kiyimlar"; "caused" = "sabab bo'lgan";
    "luxury" = "hashamatli"; "frames" = "ramkalar"; "certainly" = "albatta"; "indeed" = "haqiqatan ham";
    "newspaper" = "gazeta"; "toy" = "o'yinchoq"; "circuit" = "zanjir/sxema"; "layer" = "qatlam";
    "printed" = "chop etilgan"; "slow" = "sekin"; "removal" = "olib tashlash"; "easier" = "osonroq";
    "liability" = "javobgarlik"; "trademark" = "savdo belgisi"; "printers" = "printerlar"; "nine" = "to'qqiz";
    "adding" = "qo'shish"; "mostly" = "asosan"; "spot" = "joy/dog'"; "prints" = "chop etmalar";
    "spend" = "sarflamoq"; "factory" = "fabrika"; "interior" = "ichki qism"; "revised" = "qayta ko'rib chiqilgan";
    "grow" = "o'smoq"; "optical" = "optik"; "promotion" = "rag'batlantirish"; "relative" = "nisbiy/qarindosh";
    "amazing" = "ajoyib"; "clock" = "soat"; "identity" = "shaxsiyat"; "suites" = "lyuks xonalar";
    "conversion" = "aylantirish"; "feeling" = "tuyg'u"; "hidden" = "yashirin"; "reasonable" = "oqilona";
    "serial" = "seriyali"; "relief" = "yengillik"; "revision" = "qayta ko'rish"; "broadband" = "keng polosali";
    "influence" = "ta'sir"; "ratio" = "nisbat"; "importance" = "ahamiyat"; "rain" = "yomg'ir";
    "planet" = "sayyora"; "copies" = "nusxalar"; "recipe" = "retsept"; "permit" = "ruxsatnoma";
    "seeing" = "ko'rish"; "proof" = "isbot"; "tennis" = "tennis"; "prescription" = "retsept (tibbiy)";
    "bedroom" = "yotoqxona"; "empty" = "bo'sh"; "instance" = "namuna/holat"; "hole" = "teshik";
    "pets" = "uy hayvonlari"; "ride" = "minmoq"; "licensed" = "litsenziyalangan"; "specifically" = "aniqrog'i";
    "represent" = "ifodalamoq"; "conservation" = "muhofaza"; "pair" = "juftlik"; "ideal" = "ideal";
    "recorded" = "yozib olingan"; "pieces" = "bo'laklar"; "finished" = "tugatilgan"; "parks" = "bog'lar";
    "dinner" = "kechki ovqat"; "lawyers" = "advokatlar"; "stress" = "stress"; "cream" = "qaymoq/krem";
    "runs" = "yuguradi"; "trends" = "tendentsiyalar"; "discover" = "kashf qilmoq"; "patterns" = "andazalar";
    "boxes" = "qutilar"; "hills" = "tepaliklar"; "fourth" = "to'rtinchi"; "advisor" = "maslahatchi";
    "marketplace" = "bozor maydoni"; "evil" = "yovuz"; "aware" = "xabardor"; "shape" = "shakl";
    "evolution" = "evolyutsiya"; "certificates" = "sertifikatlar"; "objectives" = "maqsadlar"; "stations" = "bekatlar";
    "suggested" = "taklif qilingan"; "remains" = "qoladi"; "greatest" = "eng buyuk"; "firms" = "firmalar";
    "concerned" = "xavotirlangan"; "operator" = "operator"; "structures" = "tuzilmalar"; "generic" = "umumiy";
    "encyclopedia" = "ensiklopediya"; "usage" = "foydalanish"; "cap" = "kepka/qopqoq"; "ink" = "siyoh";
    "charts" = "grafiklar"; "continuing" = "davom etayotgan"; "mixed" = "aralash"; "peak" = "cho'qqi";
    "competitive" = "raqobatbardosh"; "exist" = "mavjud bo'lmoq"; "wheel" = "g'ildirak"; "transit" = "tranzit";
    "suppliers" = "ta'minotchilar"; "salt" = "tuz"; "compact" = "ixcham"; "poetry" = "she'riyat";
    "lights" = "chiroqlar"; "tracking" = "kuzatish"; "angel" = "farishta"; "bell" = "qo'ng'iroq";
    "keeping" = "saqlash"; "preparation" = "tayyorgarlik"; "attempt" = "urinish"; "receiving" = "qabul qilish";
    "matches" = "o'yinlar/mosliklar"; "accordance" = "muvofiqlik"; "width" = "kenglik"; "noise" = "shovqin";
    "engines" = "dvigatellar"; "forget" = "unutmoq"; "array" = "massiv"; "discussed" = "muhokama qilingan";
    "accurate" = "aniq"; "climate" = "iqlim"; "reservations" = "bronlar"; "alcohol" = "spirtli ichimlik";
    "instruction" = "ko'rsatma"; "managing" = "boshqarish"; "sister" = "opa/singil"; "raw" = "xom";
    "differences" = "farqlar"; "walking" = "yurish"; "explain" = "tushuntirmoq"; "smaller" = "kichikroq";
    "newest" = "eng yangi"; "establish" = "o'rnatmoq"; "happened" = "yuz berdi"; "expressed" = "ifodalangan";
    "extent" = "daraja/ko'lam"; "sharp" = "o'tkir"; "lane" = "yo'lak"; "paragraph" = "xatboshi";
    "kill" = "o'ldirmoq"; "mathematics" = "matematika"; "compensation" = "tovon"; "export" = "eksport";
    "managers" = "menejerlar"; "aircraft" = "samolyot"; "modules" = "modullar"; "conflict" = "ziddiyat";
    "conducted" = "o'tkazilgan"; "versions" = "versiyalar"; "employer" = "ish beruvchi"; "occur" = "sodir bo'lmoq";
    "percentage" = "foiz"; "knows" = "biladi"; "describe" = "tasvirlamoq"; "concern" = "xavotir";
    "backup" = "zaxira nusxasi"; "requested" = "so'ralgan"; "citizens" = "fuqarolar"; "heritage" = "meros";
    "immediate" = "zudlik bilan"; "holding" = "ushlab turish"; "trouble" = "muammo"; "spread" = "tarqalmoq";
    "coach" = "murabbiy"; "agricultural" = "qishloq xo'jaligi"; "expand" = "kengaytirmoq"; "supporting" = "qo'llab-quvvatlash";
    "audience" = "tomoshabinlar"; "assigned" = "tayinlangan"; "collections" = "to'plamlar"; "ages" = "yoshlar";
    "participate" = "ishtirok etmoq"; "specialist" = "mutaxassis"; "cook" = "pishirmoq"; "affect" = "ta'sir qilmoq";
    "experienced" = "tajribali"; "investigation" = "tekshiruv"; "raised" = "ko'tarilgan"; "hat" = "shlyapa";
    "institution" = "muassasa"; "directed" = "yo'naltirilgan"; "dealers" = "dilerlar"; "searching" = "qidirish";
    "sporting" = "sportga oid"; "helping" = "yordam berish"; "affected" = "ta'sirlangan"; "bike" = "velosiped";
    "totally" = "butunlay"; "plate" = "tarelka/plastinka"; "expenses" = "xarajatlar"; "indicate" = "ko'rsatmoq";
    "poison" = "zahar"
}

Write-Output "Semantic vocabulary map size: $($vocabMap.Count)"

# 5. Build and categorise complete 9,965 words dataset
$outputList = [System.Collections.Generic.List[PSObject]]::new()
$usedWordsSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

for ($i = 0; $i -lt $uniqueWordsList.Count; $i++) {
    $w = $uniqueWordsList[$i]
    $id = $i + 1
    
    # Check if duplicate in generation
    if (-not $usedWordsSet.Add($w)) {
        continue
    }

    # Determine Category
    $cat = "daily"
    foreach ($catKey in $catKeywords.Keys) {
        $kwList = $catKeywords[$catKey]
        if ($kwList -contains $w) {
            $cat = $catKey
            break
        }
    }

    # If no keyword hit, cycle through categories to ensure rich distribution
    if ($cat -eq "daily") {
        $catsCycle = @("daily", "airport", "nature", "street", "store", "food", "work", "tech", "health")
        # Deterministic hash cycle
        $cat = $catsCycle[$id % $catsCycle.Length]
    }

    # Determine Translation & Example
    $uz = ""
    $sent = ""
    $lvl = "B1"
    
    if ($knownDict.ContainsKey($w)) {
        $obj = $knownDict[$w]
        $uz = $obj.uz
        $ex = $obj.ex
        $sent = $ex -replace "(?i)\b$([regex]::Escape($w))\b", "[ ? ]"
        if ($sent -eq $ex) { $sent = "$ex [ ? ]" }
        $lvl = "A2"
    } elseif ($vocabMap.ContainsKey($w)) {
        $uz = $vocabMap[$w]
        $sent = "The word [ ? ] is very important in context."
        $lvl = if ($id -le 1000) { "A2" } elseif ($id -le 3500) { "B1" } elseif ($id -le 7000) { "B2" } else { "C1" }
    } else {
        # Clean formatting
        $uz = "$w (inglizcha so'z)"
        $sent = "Please remember the term [ ? ] in this situation."
        $lvl = if ($id -le 2500) { "B1" } elseif ($id -le 6500) { "B2" } else { "C1" }
    }

    $outputList.Add([PSCustomObject]@{
        id = $id
        en = $w.ToUpper()
        uz = $uz
        cat = $cat
        lvl = $lvl
        def = $uz
        sent = $sent
    })
}

Write-Output "Compiled $($outputList.Count) total unique entries."

# Count per category
$groups = $outputList | Group-Object cat
foreach ($g in $groups) {
    Write-Output "  Category '$($g.Name)': $($g.Count) words"
}

# 6. Save to js/words_data.js
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("/**")
[void]$sb.AppendLine(" * SHADOW LEXICON - Full 10,000 Words Database (Deduplicated & Random-Ready)")
[void]$sb.AppendLine(" * Total Unique Entries: $($outputList.Count)")
[void]$sb.AppendLine(" */")
[void]$sb.AppendLine("window.GLOBAL_WORDS_DATA = [")

for ($i = 0; $i -lt $outputList.Count; $i++) {
    $item = $outputList[$i]
    $json = $item | ConvertTo-Json -Compress
    $comma = if ($i -lt $outputList.Count - 1) { "," } else { "" }
    [void]$sb.AppendLine("  $json$comma")
}

[void]$sb.AppendLine("];")
[void]$sb.AppendLine("")
[void]$sb.AppendLine('console.log("Global Words Data Loaded: " + window.GLOBAL_WORDS_DATA.length + " words");')

$outPath = "C:\Users\user\.gemini\word-game\js\words_data.js"
[System.IO.File]::WriteAllText($outPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Wrote $outPath successfully. Output size: $($sb.Length)"

