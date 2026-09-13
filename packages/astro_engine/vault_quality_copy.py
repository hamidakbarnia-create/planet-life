"""Card-specific localized symbolic guidance; no computation or providers."""
LANGS = ("en", "ru", "fa", "ar")


def collapse_repeated_reason(reason: str) -> str:
    """Drop exact semicolon clauses; keep distinct evidence text."""
    if not reason:
        return ""
    arabic = "؛" in reason
    sep = "؛" if arabic else ";"
    join = "؛ " if arabic else "; "
    seen: list[str] = []
    for clause in reason.split(sep):
        item = clause.strip()
        if not item:
            continue
        key = " ".join(item.lower().split())
        if any(" ".join(existing.lower().split()) == key for existing in seen):
            continue
        seen.append(item)
    return join.join(seen)

QUALITY_COPY = {'heat': [['Optional attraction timing',
           'These windows compare symbolic timing strength for social initiative. They say nothing '
           'about another person’s interest.',
           'Choose a low-pressure invitation only if you want to; leave room for a clear answer.',
           'Using a score to justify pressure, intimacy or silence.',
           'Timing scores are symbolic weights, not probabilities of attraction. Predictive validity is '
           'unestablished; consent and another person’s response cannot be inferred.'],
          ['Необязательные окна для социальной инициативы',
           'Окна сравнивают символическую выраженность времени для инициативы в общении. Они ничего не '
           'говорят об интересе другого человека.',
           'Если хочется, предложите контакт без давления и оставьте возможность свободно ответить.',
           'Использование оценки для оправдания давления, интимной близости или молчания.',
           'Баллы — символические веса, а не вероятность притяжения. Прогностическая достоверность не '
           'установлена; согласие и ответ другого человека неизвестны.'],
          ['زمان\u200cبندی اختیاری برای آغاز گفتگو',
           'این بازه\u200cها شدت نمادین زمان را برای آغاز گفتگو مقایسه می\u200cکنند؛ نشانه\u200cای از '
           'علاقه طرف مقابل نیستند.',
           'اگر مایل هستید، پیشنهادی بدون فشار مطرح کنید و برای پاسخ آزادانه فضا بگذارید.',
           'توجیه فشار، صمیمیت یا سکوت با یک امتیاز.',
           'امتیازها وزن نمادین\u200cاند، نه احتمال جذب. اعتبار پیش\u200cبینی تأیید نشده است؛ رضایت و '
           'پاسخ طرف مقابل از آن\u200cها قابل استنباط نیست.'],
          ['توقيت اختياري للمبادرة بالتواصل',
           'تقارن هذه النوافذ قوة التوقيت الرمزية للمبادرة بالتواصل، ولا تدل على اهتمام الطرف الآخر.',
           'يمكن اقتراح لقاء بلا ضغط عند الرغبة، مع إتاحة حرية الإجابة.',
           'استخدام الدرجة لتبرير الضغط أو الحميمية أو الصمت.',
           'الدرجات أوزان رمزية وليست احتمالات للانجذاب. لم تثبت صلاحيتها للتنبؤ؛ ولا يمكن استنتاج '
           'الموافقة أو رد الطرف الآخر.']],
 'color': [['An optional colour palette',
            'A symbolic palette to try alongside your existing wardrobe.',
            'Try one main colour and a small accent in daylight.',
            'Buying something only because a colour was suggested.',
            'This palette is a presentation prompt, not a prediction of confidence, approval or '
            'success. Your taste, comfort and setting decide.'],
           ['Палитра на выбор',
            'Символическая палитра для сочетания с тем, что уже есть в гардеробе.',
            'Сравните основной цвет и небольшой акцент при дневном свете.',
            'Покупка вещи только из-за предложенного цвета.',
            'Палитра — идея для оформления образа, а не прогноз уверенности, одобрения или успеха. '
            'Решают вкус, удобство и обстановка.'],
           ['پالت رنگ پیشنهادی',
            'پالتی نمادین برای امتحان\u200cکردن در کنار لباس\u200cهای موجود شما.',
            'یک رنگ اصلی و یک جزئیات رنگی را در نور روز کنار هم ببینید.',
            'خرید لباس صرفاً به دلیل رنگ پیشنهادی.',
            'این پالت پیشنهادی برای ظاهر است، نه پیش\u200cبینی اعتمادبه\u200cنفس، تأیید یا موفقیت. '
            'سلیقه، راحتی و موقعیت شما تعیین\u200cکننده\u200cاند.'],
           ['لوحة ألوان اختيارية',
            'لوحة رمزية لتجربتها مع الملابس المتاحة بالفعل.',
            'يمكن مقارنة لون أساسي ولمسة لونية صغيرة في ضوء النهار.',
            'شراء قطعة لمجرد اقتراح لونها.',
            'هذه فكرة لتنسيق المظهر، وليست توقعاً للثقة أو القبول أو النجاح. الذوق والراحة وطبيعة '
            'المكان هي المرجع.']],
 'perfume': [['An optional scent direction',
              'These note groups are alternatives to compare, not one required blend. They do not describe your personality.',
              'Compare the suggested notes on a scent strip; choose a subtle amount appropriate to the '
              'space.',
              'Heavy fragrance in shared or scent-free spaces.',
              'Scent is an optional presentation choice, not a way to secure attraction or influence '
              'others. Preference, sensitivity and venue rules take priority.'],
             ['Идея для выбора аромата',
              'Эти группы нот — варианты для сравнения, а не один обязательный микс. Они не описывают личность.',
              'Сравните предложенные ноты на блоттере; интенсивность подбирайте с учётом места.',
              'Насыщенный аромат в общем пространстве или там, где он запрещён.',
              'Аромат — необязательная деталь образа, а не средство вызвать влечение или повлиять на '
              'других. Важнее вкус, чувствительность и правила места.'],
             ['پیشنهادی برای انتخاب رایحه',
              'این گروه‌های نت گزینه‌هایی برای مقایسه‌اند، نه یک ترکیب اجباری. توصیفی از شخصیت شما نیستند.',
              'نت\u200cهای پیشنهادی را روی کاغذ تست مقایسه کنید و میزان ملایمی متناسب با فضا انتخاب '
              'کنید.',
              'رایحه سنگین در فضای مشترک یا محیط بدون عطر.',
              'عطر انتخابی اختیاری برای ظاهر است، نه راهی برای جلب علاقه یا اثرگذاری بر دیگران. سلیقه، '
              'حساسیت و مقررات مکان اولویت دارند.'],
             ['اتجاه عطري اختياري',
              'هذه مجموعات نغمات بديلة للمقارنة، وليست مزيجاً واحداً مطلوباً. ولا تصف الشخصية.',
              'يمكن مقارنة النغمات على ورقة اختبار واختيار كمية خفيفة تناسب المكان.',
              'العطر القوي في المساحات المشتركة أو الأماكن التي تمنع العطور.',
              'العطر خيار اختياري للمظهر، وليس وسيلة لضمان الانجذاب أو التأثير في الآخرين. الأولوية '
              'للتفضيل والحساسية وقواعد المكان.']],
 'outfit': [['An optional outfit direction',
             'Use the symbolic clothing and colour as a starting point. Accessories stay optional.',
             'Try the pieces together; check weather, dress code, movement and comfort before choosing.',
             'Changing your boundaries or comfort to fit a suggested look.',
             'The meeting score measures symbolic timing strength, not the probability of date success. This is a styling prompt, not a prediction of attraction, consent or how a meeting will go. Personal preference and practical needs decide.'],
            ['Идея для образа',
             'Символические одежда и цвет — отправная точка. Аксессуары необязательны.',
             'Примерьте вещи вместе; учтите погоду, дресс-код, свободу движения и удобство.',
             'Отказ от удобства или личных границ ради предложенного образа.',
             'Оценка окна встречи — сила символического тайминга, а не вероятность удачного свидания. Это идея для стиля, а не прогноз влечения, согласия или исхода встречи. Решают личный вкус и практические потребности.'],
            ['پیشنهادی برای پوشش',
             'پوشش و رنگ نمادین می‌تواند نقطه شروع باشد. اکسسوری اختیاری می‌ماند.',
             'لباس\u200cها را با هم امتحان کنید؛ هوا، پوشش مناسب موقعیت و راحتی حرکت را در نظر بگیرید.',
             'کنارگذاشتن راحتی یا مرزهای شخصی برای هماهنگی با پیشنهاد.',
             'امتیاز بازه دیدار، شدت زمان\u200cبندی نمادین است، نه احتمال موفقیت دیدار. این پیشنهاد درباره پوشش است، نه پیش\u200cبینی جذب، رضایت یا نتیجه دیدار. سلیقه و نیازهای عملی شما تعیین\u200cکننده\u200cاند.'],
            ['اقتراح اختياري للإطلالة',
             'يمكن استخدام الملابس واللون الرمزيين كنقطة بداية. الإكسسوار يبقى اختيارياً.',
             'تجربة القطع معاً ومراجعة الطقس وقواعد اللباس وحرية الحركة تساعد في الاختيار.',
             'التخلي عن الراحة أو الحدود الشخصية من أجل إطلالة مقترحة.',
             'درجة فترة اللقاء تعبّر عن قوة التوقيت الرمزي، لا عن احتمال نجاح اللقاء. هذا اقتراح للتنسيق، وليس توقعاً للانجذاب أو الموافقة أو نتيجة اللقاء. التفضيل الشخصي والاحتياجات العملية هي المرجع.']],
 'post': [['Symbolic content timing',
           'Posting, filming and live windows are compared separately. Identical times and scores are '
           'grouped rather than repeated.',
           'Use the windows to plan a small experiment; compare results against your usual publishing '
           'baseline.',
           'Treating a high score as predicted reach or engagement.',
           'Scores measure symbolic timing strength, not expected reach, engagement or audience '
           'response. Audience data, platform analytics, content quality and the displayed timezone '
           'remain decisive.'],
          ['Символическое время для контента',
           'Окна публикации, съёмки и эфира сравниваются отдельно. Одинаковые время и баллы объединены.',
           'Используйте окна для небольшого эксперимента и сравните результат с обычными показателями '
           'публикаций.',
           'Ожидание охвата или вовлечённости на основании высокого балла.',
           'Баллы отражают символическую силу времени, а не ожидаемый охват, вовлечённость или реакцию '
           'аудитории. Решают данные аудитории, аналитика платформы, качество контента и указанный '
           'часовой пояс.'],
          ['زمان\u200cبندی نمادین محتوا',
           'بازه\u200cهای انتشار، فیلم\u200cبرداری و پخش زنده جداگانه مقایسه می\u200cشوند؛ زمان\u200cها '
           'و امتیازهای یکسان ادغام می\u200cشوند.',
           'بازه\u200cها را برای آزمایشی کوچک به کار ببرید و نتیجه را با عملکرد معمول انتشار خود مقایسه '
           'کنید.',
           'تلقی امتیاز بالا به\u200cعنوان پیش\u200cبینی بازدید یا تعامل.',
           'امتیازها شدت نمادین زمان را نشان می\u200cدهند، نه بازدید، تعامل یا واکنش مخاطب. '
           'داده\u200cهای مخاطبان، آمار پلتفرم، کیفیت محتوا و منطقه زمانی نمایش\u200cداده\u200cشده '
           'تعیین\u200cکننده\u200cاند.'],
          ['توقيت رمزي للمحتوى',
           'تُقارن نوافذ النشر والتصوير والبث كلٌّ على حدة، وتُجمع الأوقات والدرجات المتطابقة.',
           'يمكن استخدام النوافذ لتجربة صغيرة ومقارنة النتائج بالمستوى المعتاد للنشر.',
           'اعتبار الدرجة المرتفعة توقعاً للوصول أو التفاعل.',
           'تقيس الدرجات قوة التوقيت الرمزية، لا الوصول أو التفاعل أو استجابة الجمهور المتوقعة. بيانات '
           'الجمهور وتحليلات المنصة وجودة المحتوى والمنطقة الزمنية المعروضة هي المرجع.']],
 'places': [['Symbolic location comparisons',
             'Ranks order symbolic weights within this candidate list only; they are not a '
             'recommendation to move.',
             'Compare the listed places against an independently researched shortlist.',
             'Choosing a destination on the ranking alone.',
             'These comparisons cannot predict prosperity, expansion, love or relationship outcomes. '
             'Real market, legal, financial, safety and relationship evidence must guide decisions.'],
            ['Символическое сравнение мест',
             'Рейтинг упорядочивает символические веса только внутри этого списка и не советует '
             'переезд.',
             'Сопоставьте места со списком, составленным на основе независимого исследования.',
             'Выбор места только по рейтингу.',
             'Сравнение не предсказывает процветание, расширение бизнеса, любовь или исход отношений. '
             'Необходимы реальные рыночные, правовые, финансовые данные, сведения о безопасности и '
             'отношениях.'],
            ['مقایسه نمادین مکان\u200cها',
             'رتبه\u200cها فقط وزن\u200cهای نمادین همین فهرست را مرتب می\u200cکنند؛ توصیه\u200cای برای '
             'جابه\u200cجایی نیستند.',
             'مکان\u200cها را با فهرستی که بر اساس تحقیق مستقل تهیه کرده\u200cاید مقایسه کنید.',
             'انتخاب مقصد صرفاً بر اساس رتبه.',
             'این مقایسه\u200cها رفاه، گسترش کسب\u200cوکار، عشق یا نتیجه رابطه را پیش\u200cبینی '
             'نمی\u200cکنند. شواهد واقعی بازار، حقوقی، مالی، ایمنی و رابطه باید مبنای تصمیم باشند.'],
            ['مقارنة رمزية للأماكن',
             'ترتّب الدرجات الأوزان الرمزية داخل هذه القائمة فقط؛ وليست توصية بالانتقال.',
             'يمكن مقارنة الأماكن بقائمة أُعدّت استناداً إلى بحث مستقل.',
             'اختيار الوجهة بناءً على الترتيب وحده.',
             'لا تتنبأ هذه المقارنات بالازدهار أو التوسع أو الحب أو نتائج العلاقات. القرار يحتاج إلى '
             'أدلة فعلية عن السوق والقانون والمال والسلامة والعلاقات.']],
 'compatibility': [['Symbolic relationship comparison',
                    'The weights compare chart themes, not qualities measured in a relationship.',
                    'Discuss one shared priority and one difference using concrete examples from your '
                    'relationship.',
                    'Using a score to decide whether to stay, leave or commit.',
                    'All scores, including attraction, stability and growth, are symbolic comparison '
                    'weights. They cannot establish emotional compatibility, attraction, commitment or '
                    'relationship outcomes. Observable relationship evidence is decisive.'],
                   ['Символическое сравнение отношений',
                    'Веса сравнивают темы карт, а не измеренные качества отношений.',
                    'Обсудите один общий приоритет и одно различие на конкретных примерах из отношений.',
                    'Решение остаться, уйти или взять обязательства на основании балла.',
                    'Все баллы, включая притяжение, стабильность и рост, — символические веса '
                    'сравнения. Они не устанавливают эмоциональную совместимость, влечение, '
                    'обязательства или исход отношений. Решают наблюдаемые факты отношений.'],
                   ['مقایسه نمادین رابطه',
                    'وزن\u200cها مضمون\u200cهای نمودار را مقایسه می\u200cکنند، نه ویژگی\u200cهای '
                    'اندازه\u200cگیری\u200cشده رابطه را.',
                    'یک اولویت مشترک و یک تفاوت را با مثال\u200cهای مشخص از رابطه خود بررسی کنید.',
                    'تصمیم برای ماندن، رفتن یا تعهد بر اساس امتیاز.',
                    'همه امتیازها، از جمله جذب، ثبات و رشد، وزن مقایسه نمادین\u200cاند. آن\u200cها '
                    'سازگاری عاطفی، علاقه، تعهد یا نتیجه رابطه را مشخص نمی\u200cکنند. شواهد قابل مشاهده '
                    'رابطه تعیین\u200cکننده\u200cاند.'],
                   ['مقارنة رمزية للعلاقة',
                    'تقارن الأوزان موضوعات الخرائط، لا صفات مقاسة في العلاقة.',
                    'يمكن مناقشة أولوية مشتركة واختلاف واحد بأمثلة محددة من العلاقة.',
                    'اتخاذ قرار بالبقاء أو الانفصال أو الالتزام بناءً على درجة.',
                    'كل الدرجات، بما فيها الانجذاب والاستقرار والنمو، أوزان مقارنة رمزية. لا تثبت '
                    'التوافق العاطفي أو الانجذاب أو الالتزام أو نتيجة العلاقة. الأدلة الملموسة في '
                    'العلاقة هي المرجع.']],
 'trust': [['Prompts for a trust conversation',
            'Symbolic contrasts can prompt questions about expectations, boundaries and follow-through. '
            'They are not observed behavior.',
            'Choose a recent observable example and ask directly what each person expected.',
            'Treating a symbolic pattern as evidence against someone.',
            'Trustworthiness, lying, loyalty, avoidance and actual behavior cannot be inferred from '
            'charts. Observable behavior and direct conversation remain decisive.'],
           ['Вопросы для разговора о доверии',
            'Символические различия могут подсказать вопросы об ожиданиях, границах и выполнении '
            'договорённостей. Это не наблюдения за поведением.',
            'Выберите недавний конкретный пример и прямо спросите об ожиданиях каждого.',
            'Использование символического рисунка как доказательства против человека.',
            'Карты не устанавливают надёжность, ложь, верность, избегание или реальное поведение. '
            'Решают наблюдаемые поступки и прямой разговор.'],
           ['پرسش\u200cهایی برای گفتگو درباره اعتماد',
            'تفاوت\u200cهای نمادین می\u200cتوانند پرسش\u200cهایی درباره انتظارها، مرزها و عمل به '
            'توافق\u200cها ایجاد کنند؛ مشاهده رفتار نیستند.',
            'یک نمونه مشخص و اخیر انتخاب کنید و مستقیم درباره انتظار هر دو نفر بپرسید.',
            'استفاده از الگوی نمادین به\u200cعنوان مدرکی علیه کسی.',
            'اعتمادپذیری، دروغ، وفاداری، دوری\u200cکردن و رفتار واقعی از نمودار قابل استنباط نیست. '
            'رفتار قابل مشاهده و گفتگوی مستقیم تعیین\u200cکننده\u200cاند.'],
           ['أسئلة لحوار حول الثقة',
            'قد تقترح الفروق الرمزية أسئلة عن التوقعات والحدود والوفاء بالاتفاقات؛ لكنها ليست سلوكاً '
            'تمت ملاحظته.',
            'يمكن اختيار مثال حديث ومحدد والسؤال مباشرة عن توقعات كل طرف.',
            'استخدام النمط الرمزي كدليل ضد شخص.',
            'لا يمكن استنتاج الجدارة بالثقة أو الكذب أو الوفاء أو التجنب أو السلوك الفعلي من الخرائط. '
            'السلوك الملحوظ والحوار المباشر هما المرجع.']],
 'partner': [['Optional partnership prompts',
              'Use symbolic themes to explore expectations together, without defining an ideal person.',
              'Ask about priorities, boundaries and how disagreements will be discussed.',
              'Using this sketch as a filter for people or dates.',
              'These prompts cannot define personality, preferences or an ideal partner, and do not '
              'predict compatibility. Verify expectations through direct conversation and experience.'],
             ['Вопросы о партнёрстве на выбор',
              'Символические темы помогают обсуждать ожидания, но не определяют идеального человека.',
              'Спросите о приоритетах, границах и способах обсуждать разногласия.',
              'Отбор людей или партнёров для свиданий по этому описанию.',
              'Вопросы не определяют личность, предпочтения или идеального партнёра и не предсказывают '
              'совместимость. Проверяйте ожидания разговором и опытом.'],
             ['پرسش\u200cهای اختیاری درباره همراهی',
              'مضمون\u200cهای نمادین را برای بررسی مشترک انتظارها به کار ببرید، بدون تعریف فرد '
              'ایده\u200cآل.',
              'درباره اولویت\u200cها، مرزها و شیوه گفتگو هنگام اختلاف بپرسید.',
              'استفاده از این طرح برای گزینش افراد یا قرارهای آشنایی.',
              'این پرسش\u200cها شخصیت، ترجیح یا شریک ایده\u200cآل را تعریف نمی\u200cکنند و سازگاری را '
              'پیش\u200cبینی نمی\u200cکنند. انتظارها را با گفتگوی مستقیم و تجربه بررسی کنید.'],
             ['أسئلة اختيارية عن الشراكة',
              'يمكن استكشاف التوقعات معاً عبر موضوعات رمزية من دون تعريف شخص مثالي.',
              'يمكن السؤال عن الأولويات والحدود وطريقة مناقشة الاختلاف.',
              'استخدام هذا التصور لفرز الأشخاص أو مواعيد التعارف.',
              'لا تحدد هذه الأسئلة الشخصية أو التفضيلات أو الشريك المثالي، ولا تتنبأ بالتوافق. التحقق '
              'يكون بالحوار المباشر والتجربة.']],
 'business': [['Business partnership discussion',
               'Explore role clarity, decision rights and working preferences as optional discussion '
               'themes.',
               'Write down responsibilities, approval rights and a way to verify agreements in a small '
               'trial.',
               'Inferring competence or choosing a business partner from birth data.',
               'Birth data cannot establish an ideal business partner or predict compatibility. Verify '
               'roles, decision rights and working preferences through direct discussion and practical '
               'evidence.'],
              ['Обсуждение делового партнёрства',
               'Роли, полномочия и рабочие предпочтения — темы для совместного обсуждения.',
               'Запишите обязанности, права принятия решений и способ проверить договорённости в '
               'небольшом пробном проекте.',
               'Оценка компетентности или выбор делового партнёра по данным рождения.',
               'Данные рождения не определяют идеального делового партнёра и не предсказывают '
               'совместимость. Роли, полномочия и рабочие предпочтения проверяются разговором и '
               'практикой.'],
              ['گفتگو درباره شراکت کاری',
               'شفافیت نقش\u200cها، اختیار تصمیم\u200cگیری و ترجیح\u200cهای کاری را به\u200cعنوان '
               'موضوع\u200cهای اختیاری گفتگو بررسی کنید.',
               'مسئولیت\u200cها، اختیار تأیید و راه بررسی توافق\u200cها در یک همکاری آزمایشی کوچک را '
               'بنویسید.',
               'ارزیابی توانایی یا انتخاب شریک کاری بر اساس اطلاعات تولد.',
               'اطلاعات تولد شریک کاری ایده\u200cآل را مشخص نمی\u200cکند و سازگاری را پیش\u200cبینی '
               'نمی\u200cکند. نقش\u200cها، اختیار تصمیم\u200cگیری و ترجیح\u200cهای کاری را با گفتگو و '
               'شواهد عملی بررسی کنید.'],
              ['حوار حول الشراكة المهنية',
               'وضوح الأدوار وصلاحيات القرار وتفضيلات العمل موضوعات اختيارية للنقاش.',
               'يمكن تدوين المسؤوليات وصلاحيات الموافقة وطريقة للتحقق من الاتفاقات في تجربة عمل صغيرة.',
               'استنتاج الكفاءة أو اختيار شريك مهني من بيانات الميلاد.',
               'لا تحدد بيانات الميلاد شريكاً مهنياً مثالياً ولا تتنبأ بالتوافق. التحقق من الأدوار '
               'وصلاحيات القرار وتفضيلات العمل يحتاج إلى نقاش مباشر وأدلة عملية.']]}


# Sign themes are invitations to compare experiences, never a partner specification.
PARTNER_THEMES = {'aries': ('initiative and pace',
           'инициатива и темп',
           'پیش\u200cقدم\u200cشدن و آهنگ پیشرفت',
           'المبادرة والإيقاع'),
 'taurus': ('continuity and practical resources',
            'постоянство и практические ресурсы',
            'تداوم و امکانات عملی',
            'الاستمرارية والموارد العملية'),
 'gemini': ('questions and exchange of ideas',
            'вопросы и обмен идеями',
            'پرسش و تبادل نظر',
            'الأسئلة وتبادل الأفكار'),
 'cancer': ('care and shared space',
            'забота и общее пространство',
            'توجه و فضای مشترک',
            'الرعاية والمساحة المشتركة'),
 'leo': ('recognition and creative expression',
         'признание и творческое выражение',
         'قدردانی و بیان خلاقانه',
         'التقدير والتعبير الإبداعي'),
 'virgo': ('useful routines and attention to detail',
           'полезные привычки и внимание к деталям',
           'روال\u200cهای مفید و توجه به جزئیات',
           'العادات المفيدة والاهتمام بالتفاصيل'),
 'libra': ('fairness and negotiation', 'справедливость и переговоры', 'انصاف و مذاکره', 'الإنصاف والتفاوض'),
 'scorpio': ('shared boundaries and vulnerability',
             'общие границы и уязвимость',
             'مرزهای مشترک و آسیب\u200cپذیری',
             'الحدود المشتركة والهشاشة'),
 'sagittarius': ('exploration and differing perspectives',
                 'исследование и разные точки зрения',
                 'کاوش و دیدگاه\u200cهای متفاوت',
                 'الاستكشاف وتنوع وجهات النظر'),
 'capricorn': ('responsibilities and long-term planning',
               'ответственность и долгосрочное планирование',
               'مسئولیت\u200cها و برنامه\u200cریزی بلندمدت',
               'المسؤوليات والتخطيط الطويل الأمد'),
 'aquarius': ('independence and collective ideas',
              'самостоятельность и общие идеи',
              'استقلال و ایده\u200cهای جمعی',
              'الاستقلال والأفكار الجماعية'),
 'pisces': ('imagination and room for ambiguity',
            'воображение и место для неоднозначности',
            'تخیل و پذیرش ابهام',
            'الخيال وتقبّل الغموض')}

def partner_symbolic_details(venus_sign, moon_sign, seventh_sign, lang):
    from .vault_templates import SIGN_LABEL
    index = LANGS.index(lang if lang in LANGS else "en")
    contexts = (
        ("Presentation symbolism", "Символика самовыражения", "نمادهای بیان فردی", "رمزية التعبير"),
        ("Shared-space symbolism", "Символика общего пространства", "نمادهای فضای مشترک", "رمزية المساحة المشتركة"),
        ("Agreement symbolism", "Символика договорённостей", "نمادهای توافق", "رمزية الاتفاقات"),
    )
    result = []
    for context, sign in zip(contexts, (venus_sign, moon_sign, seventh_sign)):
        if sign not in PARTNER_THEMES:
            continue
        theme = PARTNER_THEMES[sign][index]
        label = SIGN_LABEL[sign][LANGS[index]]
        value = (
            f"{label} symbolically suggests {theme}. Which, if any, fits your experience?",
            f"{label}: символические темы — {theme}. Что из этого, если что-то подходит, отражает ваш опыт?",
            f"{label} از نظر نمادین به {theme} اشاره دارد. آیا چیزی از این مضمون با تجربه شما سازگار است؟",
            f"{label}: موضوعات رمزية تشمل {theme}. هل يتوافق شيء منها مع التجربة الفعلية؟",
        )[index]
        existing = next((row for row in result if row["value"] == value), None)
        if existing:
            existing["label"] += " / " + context[index]
        else:
            result.append({"label": context[index], "value": value})
    return result


# Presentation of existing calculated factors only; these helpers do not score charts.
_PLANETS = {
    "sun": ("Sun", "Солнце", "خورشید", "الشمس"),
    "moon": ("Moon", "Луна", "ماه", "القمر"),
    "mercury": ("Mercury", "Меркурий", "عطارد", "عطارد"),
    "venus": ("Venus", "Венера", "زهره", "الزهرة"),
    "mars": ("Mars", "Марс", "مریخ", "المريخ"),
    "jupiter": ("Jupiter", "Юпитер", "مشتری", "المشتري"),
    "saturn": ("Saturn", "Сатурн", "زحل", "زحل"),
    "uranus": ("Uranus", "Уран", "اورانوس", "أورانوس"),
    "neptune": ("Neptune", "Нептун", "نپتون", "نبتون"),
    "pluto": ("Pluto", "Плутон", "پلوتو", "بلوتو"),
}
_ASPECT_PROMPTS = {
    "conjunction": ("shared priorities", "общие приоритеты", "اولویت‌های مشترک", "الأولويات المشتركة"),
    "sextile": ("possible ways to coordinate", "возможные способы согласования", "راه‌های هماهنگی", "طرق التنسيق الممكنة"),
    "trine": ("agreements worth making explicit", "договорённости, которые стоит уточнить", "توافق‌هایی که بهتر است روشن شوند", "الاتفاقات التي تستحق التوضيح"),
    "square": ("different approaches to a decision", "разные подходы к решению", "رویکردهای متفاوت به تصمیم‌گیری", "المقاربات المختلفة للقرار"),
    "opposition": ("balancing separate priorities", "согласование отдельных приоритетов", "هماهنگی میان اولویت‌های جداگانه", "الموازنة بين الأولويات المختلفة"),
}
_ASPECT_DEGREES = {"conjunction": 0, "sextile": 60, "square": 90, "trine": 120, "opposition": 180}

def partner_comparison_details(harmony, tension, lang):
    """Two closest existing two-chart factors, with optional agreement prompts."""
    i = LANGS.index(lang if lang in LANGS else "en")
    rows = []
    for factor in sorted(harmony + tension, key=lambda f: f["orb"])[:2]:
        aspect = factor.get("aspect")
        left, right = factor.get("my_planet"), factor.get("their_planet")
        if aspect not in _ASPECT_PROMPTS or left not in _PLANETS or right not in _PLANETS:
            continue
        theme = _ASPECT_PROMPTS[aspect][i]
        pair = _PLANETS[left][i] + " / " + _PLANETS[right][i]
        angle = _ASPECT_DEGREES[aspect]
        value = (
            f"The {angle}° pattern between the two charts is a symbolic prompt about {theme}. Compare this with actual agreements; it describes neither person.",
            f"Угол {angle}° между двумя картами — символический повод обсудить тему: {theme}. Сопоставьте её с реальными договорённостями; это не описание людей.",
            f"الگوی {angle} درجه میان دو چارت، این موضوع نمادین را مطرح می‌کند: {theme}. آن را با توافق‌های واقعی مقایسه کنید؛ این توصیف هیچ‌یک از افراد نیست.",
            f"النمط بزاوية {angle} درجة بين الخريطتين يطرح موضوعاً رمزياً: {theme}. المرجع هو الاتفاقات الفعلية؛ وليس هذا وصفاً لأي من الشخصين.",
        )[i]
        # Repeated angular themes are one prompt, even when several planet pairs share them.
        existing = next((row for row in rows if row["value"] == value), None)
        if existing:
            existing["label"] += " · " + pair
        else:
            rows.append({"source": "two_chart_comparison", "label": ("Two-chart prompt: ", "Вопрос по двум картам: ", "پرسش از مقایسه دو چارت: ", "موضوع من مقارنة الخريطتين: ")[i] + pair, "value": value})
    return rows


def geography_symbolic_reason(effect, relocation, lang):
    """Explain the existing ranked effect without interpreting it as an outcome."""
    i = LANGS.index(lang if lang in LANGS else "en")
    axes = {
        "AC": ("presentation", "самовыражение", "نحوه حضور", "أسلوب الحضور"),
        "DC": ("agreements", "договорённости", "توافق‌ها", "الاتفاقات"),
        "MC": ("public roles", "общественные роли", "نقش‌های اجتماعی", "الأدوار العامة"),
        "IC": ("foundations", "основы", "پایه‌ها", "الأسس"),
    }
    rows = []
    for reason in (effect.get("reasons") or []):
        planet = reason.get("planet")
        if planet not in _PLANETS:
            continue
        name = _PLANETS[planet][i]
        axis, house = reason.get("angle"), reason.get("house")
        if axis in axes:
            theme = axes[axis][i]
            # Use already calculated coordinates; separation is display precision only.
            longitude = (relocation.get("planets", {}).get(planet) or {}).get("longitude")
            angle = relocation.get("angles", {}).get(axis)
            if longitude is None or angle is None:
                continue
            distance = abs((float(longitude) - float(angle) + 180) % 360 - 180)
            rows.append((f"{name}: {distance:.2f}° from the chart axis symbolizing {theme}",
                         f"{name}: {distance:.2f}° от оси карты, символизирующей тему «{theme}»",
                         f"{name}: فاصله {distance:.2f} درجه از محور نمادین {theme} در چارت",
                         f"{name}: بُعد {distance:.2f} درجة عن محور الخريطة الذي يرمز إلى {theme}")[i])
        elif isinstance(house, int) and 1 <= house <= 12:
            theme = PARTNER_THEMES[list(PARTNER_THEMES)[house - 1]][i]
            # Sector alone can match in nearby cities. Show the actual nearest-axis
            # separation as context, without inventing a different theme or rank.
            longitude = (relocation.get("planets", {}).get(planet) or {}).get("longitude")
            candidates = [(abs((float(longitude) - float(v) + 180) % 360 - 180), k)
                          for k, v in relocation.get("angles", {}).items() if k in axes] if longitude is not None else []
            nearest = min(candidates) if candidates else None
            context = ""
            if nearest:
                distance, axis = nearest
                axis_theme = axes[axis][i]
                context = (f"; {distance:.2f}° from the axis symbolizing {axis_theme}",
                           f"; {distance:.2f}° от оси, символизирующей тему «{axis_theme}»",
                           f"؛ فاصله {distance:.2f} درجه از محور نمادین {axis_theme}",
                           f"؛ بُعد {distance:.2f} درجة عن المحور الرمزي لموضوع {axis_theme}")[i]
            rows.append((f"{name}: chart sector {house}, a symbolic theme of {theme}",
                         f"{name}: сектор карты {house}, символическая тема — {theme}",
                         f"{name}: بخش {house} چارت، با مضمون نمادین {theme}",
                         f"{name}: القطاع {house} من الخريطة، بموضوع رمزي هو {theme}")[i] + context)
    joined = ("؛ " if lang in {"fa", "ar"} else "; ").join(dict.fromkeys(rows))
    return collapse_repeated_reason(joined)
