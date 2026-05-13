const BOOK_DEFINITIONS = {
  Genesis: {
    aliases: {
      ja: ["創世記", "創"],
      en: ["Genesis"],
      abbr: ["Gen"],
    },
  },
  Psalm: {
    aliases: {
      ja: ["詩篇", "詩"],
      en: ["Psalm", "Psalms"],
      abbr: ["Ps"],
    },
  },
  Isaiah: {
    aliases: {
      ja: ["イザヤ", "イザヤ書"],
      en: ["Isaiah"],
      abbr: ["Isa"],
    },
  },
  Matthew: {
    aliases: {
      ja: ["マタイ", "マタイによる福音書"],
      en: ["Matthew"],
      abbr: ["Matt"],
      short: ["Mt"],
    },
  },
  Luke: {
    aliases: {
      ja: ["ルカ", "ルカによる福音書"],
      en: ["Luke"],
      abbr: ["Lk"],
    },
  },
  John: {
    aliases: {
      ja: ["ヨハネ", "ヨハネによる福音書"],
      en: ["John"],
      abbr: ["Jn"],
    },
  },
  Romans: {
    aliases: {
      ja: ["ローマ", "ローマ人への手紙"],
      en: ["Romans"],
      abbr: ["Rom"],
    },
  },
  "1 Corinthians": {
    aliases: {
      ja: ["1コリント", "第一コリント", "第1コリント", "コリント人への第一の手紙"],
      en: ["1 Corinthians", "First Corinthians"],
      abbr: ["1Cor"],
    },
  },
  "2 Corinthians": {
    aliases: {
      ja: ["2コリント", "第二コリント", "第2コリント", "コリント人への第二の手紙"],
      en: ["2 Corinthians", "Second Corinthians"],
      abbr: ["2Cor"],
    },
  },
  Galatians: {
    aliases: {
      ja: ["ガラテヤ", "ガラテヤ人への手紙"],
      en: ["Galatians"],
      abbr: ["Gal"],
    },
  },
  Ephesians: {
    aliases: {
      ja: ["エペソ", "エペソ人への手紙"],
      en: ["Ephesians"],
      abbr: ["Eph"],
    },
  },
  Philippians: {
    aliases: {
      ja: ["ピリピ", "ピリピ人への手紙"],
      en: ["Philippians"],
      abbr: ["Phil", "Php"],
    },
  },
  Colossians: {
    aliases: {
      ja: ["コロサイ", "コロサイ人への手紙"],
      en: ["Colossians"],
      abbr: ["Col"],
    },
  },
  Hebrews: {
    aliases: {
      ja: ["ヘブル", "ヘブル人への手紙"],
      en: ["Hebrews"],
      abbr: ["Heb"],
    },
  },
  James: {
    aliases: {
      ja: ["ヤコブ", "ヤコブの手紙"],
      en: ["James"],
      abbr: ["Jas"],
    },
  },
  "1 Peter": {
    aliases: {
      ja: ["1ペテロ", "第一ペテロ", "第1ペテロ", "ペテロの第一の手紙"],
      en: ["1 Peter", "First Peter"],
      abbr: ["1Pet"],
    },
  },
  "1 John": {
    aliases: {
      ja: ["1ヨハネ", "第一ヨハネ", "第1ヨハネ", "ヨハネの第一の手紙"],
      en: ["1 John", "First John"],
      abbr: ["1Jn"],
    },
  },
  Revelation: {
    aliases: {
      ja: ["黙示録", "ヨハネの黙示録"],
      en: ["Revelation"],
      abbr: ["Rev"],
    },
  },
  Numbers: {
    aliases: {
      ja: ["民数記", "民"],
      en: ["Numbers"],
      abbr: ["Num"],
    },
  },
  Ezekiel: {
    aliases: {
      ja: ["エゼキエル", "エゼキエル書"],
      en: ["Ezekiel"],
      abbr: ["Ezek"],
    },
  },
};

const REFERENCE_DEFINITIONS = {
  "Genesis 1:1": {
    canonical: "創世記 1:1",
    summary: "天地創造の冒頭で、神が万物の始源であることを宣言する節です。",
    parallels: [
      "ヨハネ 1:1-3: ことばによる創造の視点",
      "ヘブル 11:3: 神のことばによる世界形成",
      "詩篇 33:6: 主のことばによる天の創造",
    ],
    originalLanguage: [
      {
        label: "Hebrew",
        text: "בְּרֵאשִׁית בָּרָא אֱלֹהִים",
        note: "bereshit bara Elohim",
      },
    ],
    vocabulary: [
      "בְּרֵאשִׁית (bereshit): 初めに、起源において",
      "בָּרָא (bara): 神が創造する",
      "אֱלֹהִים (Elohim): 神",
    ],
    commentary: [
      "創造の主体は被造物ではなく神である、という神学的前提を提示する。",
      "時間と空間の始まりを示す導入句として、聖書全体の世界観を形づくる。",
      "bara は神の創造行為に特有の語として、主権的創造を強調する。",
    ],
  },
  "Psalm 23:1": {
    canonical: "詩篇 23:1",
    summary: "主を羊飼いとする比喩で、神の養いと導きを告白する節です。",
    parallels: [
      "ヨハネ 10:11: 良い羊飼いとしてのキリスト",
      "エゼキエル 34:11-15: 神ご自身が羊を養う約束",
      "黙示録 7:17: 小羊が牧者となる終末的希望",
    ],
    originalLanguage: [
      {
        label: "Hebrew",
        text: "יְהוָה רֹעִי לֹא אֶחְסָר",
        note: "Adonai ro'i lo ehsar",
      },
    ],
    vocabulary: [
      "רֹעִי (ro'i): 私の羊飼い",
      "לֹא אֶחְסָר (lo ehsar): 欠けることがない",
      "יְהוָה (YHWH): 契約の主",
    ],
    commentary: [
      "羊飼いの比喩は保護だけでなく、方向づけと所有関係も含む。",
      "『欠けることがない』は欲望の充足よりも、必要の充足を指す。",
      "個人的告白の形をとることで、共同体の信仰が個人の信頼へ落とし込まれている。",
    ],
  },
  "Isaiah 53:5": {
    canonical: "イザヤ 53:5",
    summary: "苦難のしもべが他者の罪と平和のために傷つくことを語る節です。",
    parallels: [
      "1ペテロ 2:24: その傷によって癒やされた",
      "ローマ 4:25: 私たちの義のために引き渡された",
      "2コリント 5:21: 罪を知らない方が罪とされた",
    ],
    originalLanguage: [
      {
        label: "Hebrew",
        text: "וּבַחֲבֻרָתוֹ נִרְפָּא־לָנוּ",
        note: "uvachavurato nirpa lanu",
      },
    ],
    vocabulary: [
      "מְחֹלָל (mecholal): 刺し貫かれた、傷つけられた",
      "מוּסַר (musar): 懲らしめ、訓戒",
      "שָׁלוֹם (shalom): 平和、全き状態",
    ],
    commentary: [
      "代理的苦難が中心主題であり、しもべの苦しみは自己目的ではない。",
      "平和と癒やしは罪の赦しと関係修復の結果として描かれる。",
      "新約では受難のキリスト理解の主要背景として繰り返し参照される。",
    ],
  },
  "Matthew 5:3": {
    canonical: "マタイ 5:3",
    summary: "山上の説教の冒頭で、霊的貧しさを自覚する者の幸いを語る節です。",
    parallels: [
      "ルカ 6:20: 貧しい人々の幸い",
      "イザヤ 57:15: へりくだる者と共に住まわれる神",
      "ヤコブ 4:6: 神はへりくだる者に恵みを与える",
    ],
    originalLanguage: [
      {
        label: "Greek",
        text: "μακάριοι οἱ πτωχοὶ τῷ πνεύματι",
        note: "makarioi hoi ptōchoi tō pneumati",
      },
    ],
    vocabulary: [
      "μακάριοι (makarioi): 幸いな、祝福された",
      "πτωχοὶ (ptōchoi): 貧しい、乞う者のように依存する",
      "πνεύματι (pneumati): 霊において",
    ],
    commentary: [
      "ここでの幸いは感情状態ではなく、神の国に属する状態を示す。",
      "『霊において貧しい』は自己義の否定と神への全面的依存を含む。",
      "弟子道の入口として、価値の逆転が山上の説教全体を支配する。",
    ],
  },
  "John 1:1": {
    canonical: "ヨハネ 1:1",
    summary: "ことばの永遠性、神との関係、神性を圧縮して示す節です。",
    parallels: [
      "創世記 1:1: 初めにという創造の起点",
      "コロサイ 1:15-17: 万物に先立つ方",
      "ヘブル 1:1-3: 御子による啓示と保持",
    ],
    originalLanguage: [
      {
        label: "Greek",
        text: "Ἐν ἀρχῇ ἦν ὁ λόγος",
        note: "En archē ēn ho logos",
      },
      {
        label: "Greek",
        text: "καὶ θεὸς ἦν ὁ λόγος",
        note: "kai theos ēn ho logos",
      },
    ],
    vocabulary: [
      "ἀρχῇ (archē): 初め、起源",
      "λόγος (logos): ことば、理性的表現、啓示",
      "θεὸς (theos): 神",
    ],
    commentary: [
      "創世記の冒頭を想起させつつ、ことばの先在性を宣言する。",
      "ことばは神と区別されつつ、神的本質を共有する存在として描かれる。",
      "ヨハネ福音書全体のキリスト論的土台をなす導入節である。",
    ],
  },
  "John 3:16": {
    canonical: "ヨハネ 3:16",
    summary: "神の愛、御子の賜物、信仰、永遠のいのちの関係を示す節です。",
    parallels: [
      "ローマ 5:8: 罪人への神の愛",
      "1ヨハネ 4:9-10: 御子を遣わされた愛",
      "民数記 21:8-9: 見上げて生きるモーセの青銅の蛇",
    ],
    originalLanguage: [
      {
        label: "Greek",
        text: "Οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον",
        note: "Houtōs gar ēgapēsen ho theos ton kosmon",
      },
    ],
    vocabulary: [
      "ἠγάπησεν (ēgapēsen): 愛した",
      "κόσμον (kosmon): 世界、人類秩序",
      "μονογενῆ (monogenē): ひとり子、唯一の子",
      "ζωὴν αἰώνιον (zōēn aiōnion): 永遠のいのち",
    ],
    commentary: [
      "愛は抽象概念ではなく、御子を与える行為として定義される。",
      "『このように』は愛の強さだけでなく、愛の具体的方法をも含意する。",
      "滅びと永遠のいのちの対比によって、信仰応答の重大さが示される。",
    ],
  },
  "Romans 8:28": {
    canonical: "ローマ 8:28",
    summary: "神を愛する者に対する神の摂理的働きを語る節です。",
    parallels: [
      "創世記 50:20: 悪意を神が善に変えた",
      "エペソ 1:11: 御心の計画に従って万事を行う神",
      "ヤコブ 1:2-4: 試練を通した成熟",
    ],
    originalLanguage: [
      {
        label: "Greek",
        text: "πάντα συνεργεῖ εἰς ἀγαθόν",
        note: "panta synergei eis agathon",
      },
    ],
    vocabulary: [
      "πάντα (panta): すべてのこと",
      "συνεργεῖ (synergei): 共に働く",
      "ἀγαθόν (agathon): 善、益",
      "κλητοῖς (klētois): 招かれた者たち",
    ],
    commentary: [
      "すべての出来事がそれ自体で善だと言っているのではなく、神が善へ向けて働かれると述べる。",
      "文脈上、この約束は苦難の中での望みと栄化の連続の中に置かれている。",
      "神の主権と召命の確かさが信徒の慰めの根拠となる。",
    ],
  },
  "Philippians 4:6-7": {
    canonical: "ピリピ 4:6-7",
    summary: "思い煩いに対して、祈りと感謝を通して神の平安が与えられることを語る節です。",
    parallels: [
      "1ペテロ 5:7: 思い煩いを神にゆだねる",
      "マタイ 6:25-33: 何を食べようかと思い煩うな",
      "イザヤ 26:3: 全き平安に守られる心",
    ],
    originalLanguage: [
      {
        label: "Greek",
        text: "μηδὲν μεριμνᾶτε, ἀλλ᾽ ἐν παντὶ τῇ προσευχῇ",
        note: "mēden merimnate, all' en panti tē proseuchē",
      },
    ],
    vocabulary: [
      "μεριμνᾶτε (merimnate): 思い煩う",
      "προσευχῇ (proseuchē): 祈り",
      "εὐχαριστίας (eucharistias): 感謝",
      "εἰρήνη (eirēnē): 平安",
      "φρουρήσει (phrourēsei): 守る、見張る",
    ],
    commentary: [
      "禁止命令と代替行動が対で示され、思い煩いへの実践的応答が提示される。",
      "平安は問題の即時解決ではなく、心と思いを守る神の臨在として描かれる。",
      "祈りに感謝が結びつくことで、すでに与えられている恵みの記憶が不安を組み替える。",
    ],
  },
};

function normalizeBookDefinitions(books) {
  return Object.fromEntries(
    Object.entries(books).map(([bookKey, definition]) => [
      bookKey,
      {
        aliases: {
          ja: normalizeStringList(definition.aliases && definition.aliases.ja),
          en: normalizeStringList(definition.aliases && definition.aliases.en),
          abbr: normalizeStringList(definition.aliases && definition.aliases.abbr),
          short: normalizeStringList(definition.aliases && definition.aliases.short),
        },
      },
    ]),
  );
}

function normalizeReferenceDefinitions(references) {
  return Object.fromEntries(
    Object.entries(references).map(([referenceKey, definition]) => [
      referenceKey,
      {
        canonical: normalizeText(definition.canonical),
        summary: normalizeText(definition.summary),
        parallels: normalizeStringList(definition.parallels),
        originalLanguage: normalizeOriginalLanguageList(definition.originalLanguage),
        vocabulary: normalizeStringList(definition.vocabulary),
        commentary: normalizeStringList(definition.commentary),
      },
    ]),
  );
}

function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

function normalizeStringList(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => typeof item === "string" && item.trim());
}

function normalizeOriginalLanguageList(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(Boolean)
    .map((item) => ({
      label: normalizeText(item.label),
      text: normalizeText(item.text),
      note: normalizeText(item.note),
    }))
    .filter((item) => item.label || item.text || item.note);
}

window.BibleDataStore = {
  books: normalizeBookDefinitions(BOOK_DEFINITIONS),
  references: normalizeReferenceDefinitions(REFERENCE_DEFINITIONS),
};
