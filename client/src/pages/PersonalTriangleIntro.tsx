import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PersonalTriangleIntro() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'personas' | 'theory' | 'howto'>('personas');
  const [acknowledged, setAcknowledged] = useState(false);

  const handleProceed = () => {
    if (acknowledged) {
      localStorage.setItem('personalTriangleIntroViewed', 'true');
      navigate('/tools/personal-triangle');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/tools')} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-right flex-1">المثلث الشخصي</h1>
          <div className="text-3xl">🔺</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-center mb-4">المثلث الشخصي</h2>

          <div className="bg-blue-50 rounded p-4 text-right mb-4 space-y-3">
            <p className="text-gray-800 leading-relaxed">
              كل واحد فينا جواه <strong>تلات شخصيات</strong> اللي بتفكر في أي حاجة من خلالهم:
            </p>
            <ul className="list-disc list-inside text-gray-800 space-y-1">
              <li><strong>الضحيه (Victim)</strong> — الجزء الجريح اللي بيتضرر</li>
              <li><strong>الجاني (Abuser/Criminal)</strong> — الجزء اللي بيأمر وبيدفع للتعاطي</li>
              <li><strong>المتفرج (Bystander) — الضمير</strong> — الجزء اللي بيعرف الصح والغلط</li>
            </ul>
          </div>

          <p className="text-gray-700 text-right leading-relaxed mb-4">
            <strong>الحكاية بتبدأ كده:</strong>
          </p>
          <p className="text-gray-700 text-right leading-relaxed mb-4">
            في الأول، التلات شخصيات دي كانت <strong>برة منك</strong>. أنت كنت الضحيه اللي في واحد صاحبك أو قريبك عرّفك على المخدرات. يومها أنت كنت الضحيه وهو كان الجاني. ولما رحت البيت واستخبيت من أهلك علشان ما يعرفوا إنك شربت أي حاجة — هما كانوا المتفرج.
          </p>

          <p className="text-gray-700 text-right leading-relaxed mb-4">
            <strong>لكن مع مرور الوقت</strong> وتكرار الشرب، التلات شخصيات دول <strong>دخلوا جواك</strong> وبقوا جزء من تفكيرك وشخصيتك:
          </p>
          <ul className="list-disc list-inside text-gray-700 text-right space-y-2 mb-4">
            <li>أنت <strong>الضحيه</strong> اللي بتشرب وبيقع عليها تأثير المخدر</li>
            <li>أنت <strong>الجاني</strong> اللي بيعرف يخلي الضحيه تشرب وبيخليها تشتري مخدرات وتعمل كل الأفعال اللي تخليها تفضل في دايرة المخدرات</li>
            <li>أنت برضه <strong>المتفرج</strong> اللي عارف الصح من الغلط، لكن بتفضل بتتفرج على الضحيه والجاني بيحركك وبيخليك تشرب وتغوص أكتر في المشاكل — بدون ما تاخد أي رد فعل للدفاع عن الضحيه</li>
          </ul>

          <div className="bg-amber-50 rounded p-4 text-right mb-4">
            <p className="text-gray-800 font-medium mb-2">المهم تفهمها:</p>
            <p className="text-gray-800 leading-relaxed">
              أي فكرة بتيجي جوه راسك هي ممكن تكون فكرة ضحيه أو جاني أو متفرج. <strong>محتاج نتعلم نفرق بين الأصوات دي</strong> علشان نعرف مين اللي بيتكلم جواك.
            </p>
          </div>

          <p className="text-gray-700 text-right leading-relaxed mb-4">
            <strong>المتفرج هو صوت الضمير</strong> اللي جواك. مع العلاج، حنحاول نفعّله علشان يقدر <strong>يدافع عن الضحيه ويحميها من الجاني</strong>.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg shadow p-2">
          <button
            onClick={() => setActiveSection('personas')}
            className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
              activeSection === 'personas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الأصوات الثلاثة
          </button>
          <button
            onClick={() => setActiveSection('theory')}
            className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
              activeSection === 'theory'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            النظرية
          </button>
          <button
            onClick={() => setActiveSection('howto')}
            className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
              activeSection === 'howto'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            كيفية الاستخدام
          </button>
        </div>

        {/* Personas Section */}
        {activeSection === 'personas' && (
          <div className="space-y-4">
            {/* Abuser/Criminal Voice */}
            <div className="bg-red-50 border-r-4 border-red-600 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">🔴</span>
                <h3 className="text-2xl font-bold text-right text-red-800 flex-1">الجاني</h3>
              </div>
              <p className="text-gray-700 text-right font-medium mb-2">من يكون:</p>
              <p className="text-gray-700 text-right mb-4 leading-relaxed">
                الصوت الذي استدخلته من سنوات الإدمان. هو دخل جواك لما كنت بتشرب بتكرار. <strong>هذا ليس أنت الحقيقي</strong> — هو صوت خارجي استقر في رأسك. يتحدث مثل من أدمنك على المخدرات أو مثل غريزتك الإدمانية اللي بتبرر الانتكاسة.
              </p>
              <p className="text-gray-700 text-right font-medium mb-2">طريقة كلامه:</p>
              <p className="text-sm text-gray-600 text-right mb-3 font-medium">
                لما يتكلم <strong>مع الضحيه</strong> بيكون دايماً <strong>بصيغة أمر مباشر</strong>:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-right space-y-1 mb-4">
                <li>"روح اشرب"</li>
                <li>"كلم أصحاب العجز"</li>
                <li>"انت مش قادر تقاوم — استسلم"</li>
                <li>"لا حد فاهم اللي انت فيه — روح أصحابك"</li>
              </ul>

              <div className="bg-white rounded p-4 text-right">
                <p className="text-sm font-medium text-gray-600 mb-2">لما يتكلم مع المتفرج (عن المبادئ):</p>
                <p className="text-gray-800 italic">
                  "المبادئ دي تتجزأ. ماحدش بيقدر يبطل."
                </p>
              </div>
            </div>

            {/* Victim */}
            <div className="bg-green-50 border-r-4 border-green-600 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">🟢</span>
                <h3 className="text-2xl font-bold text-right text-green-800 flex-1">الضحيه</h3>
              </div>
              <p className="text-gray-700 text-right font-medium mb-2">من يكون:</p>
              <p className="text-gray-700 text-right mb-4 leading-relaxed">
                صوتك الحقيقي — الجزء الذي تألم من الإدمان، الجزء اللي بيشرب ويقع عليه التأثير، الجزء الجريح اللي بيطلب الحماية والأمان، اللي يستحق الحب والرعاية والتعافي.
              </p>
              <p className="text-gray-700 text-right font-medium mb-2">طريقة كلامه:</p>
              <p className="text-sm text-gray-600 text-right mb-3 font-medium">
                لما يتكلم <strong>مع الجاني والمتفرج</strong> بيكون دايماً <strong>بصيغة رجاء ودعاء</strong>:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-right space-y-1 mb-4">
                <li>"أنا مش عاوز أعمل كده"</li>
                <li>"أنا مش قادر أقاوم الفكرة"</li>
                <li>"ساعدني من فضلك"</li>
                <li>"أنا خايف من الانتكاسة"</li>
              </ul>
              <div className="bg-white rounded p-4 text-right">
                <p className="text-sm font-medium text-gray-600 mb-2">أمثلة على ما قد يقول:</p>
                <p className="text-gray-800 italic">
                  "أنا خائف. أنا بحاجة إلى شعور بالأمان. ساعدني أرجوك."
                </p>
              </div>
            </div>

            {/* Bystander */}
            <div className="bg-blue-50 border-r-4 border-blue-600 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">🔵</span>
                <h3 className="text-2xl font-bold text-right text-blue-800 flex-1">المتفرج (الضمير)</h3>
              </div>
              <p className="text-gray-700 text-right font-medium mb-2">من يكون:</p>
              <p className="text-gray-700 text-right mb-4 leading-relaxed">
                الجزء الحكيم والموضوعي فيك. عقلك الصافي اللي بيعرف الصح من الغلط. المتفرج بيعرف الحقيقة وبيحاول يحمي الضحيه من الجاني — لكن للأسف في البداية بيفضل بيتفرج بدون ما يقول حاجة قوية.
              </p>
              <p className="text-gray-700 text-right font-medium mb-2">طريقة كلامه:</p>
              <p className="text-sm text-gray-600 text-right mb-3 font-medium">
                لما يتكلم <strong>مع الضحيه</strong> بيكون <strong>بصيغة أمر</strong> (لكن حامي):
              </p>
              <ul className="list-disc list-inside text-gray-700 text-right space-y-1 mb-3">
                <li>"احضر الجروب بتاعك"</li>
                <li>"متوقعش أمانة حد"</li>
                <li>"روح اتكلم مع المعالج"</li>
              </ul>

              <p className="text-sm text-gray-600 text-right mb-3 font-medium">
                لما يتكلم <strong>مع الجاني</strong> بيكون <strong>عن المبادئ والحقائق</strong>:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-right space-y-1 mb-4">
                <li>"في حد بيقدر يبطل — ما فيش حد اسمه مستحيل"</li>
                <li>"المبادئ دي ما تتجزأ — إما حقيقة أو كذب"</li>
                <li>"ما حد فاهم الحاجات دي زي ما أنا فاهمها"</li>
              </ul>

              <div className="bg-white rounded p-4 text-right">
                <p className="text-sm font-medium text-gray-600 mb-2">أمثلة على ما قد يقول:</p>
                <p className="text-gray-800 italic mb-2">
                  للضحيه: "روح اتفرج على الجروب — هناك ناس شبهك بطلت"
                </p>
                <p className="text-gray-800 italic">
                  للجاني: "الحقيقة إنك ممكن تقاوم. أنا شُفت ناس كتير قاومت."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Language of Dialogue */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-right mb-4">🗣️ لغة الحوار — تعلّم تميز الأصوات</h3>

          <p className="text-gray-700 text-right leading-relaxed mb-4">
            <strong>مهم جداً:</strong> تعلم تفرق بين الأصوات بناءً على <strong>طريقة كلامهم</strong>:
          </p>

          <div className="space-y-3">
            <div className="bg-red-50 rounded p-3 text-right">
              <p className="text-sm font-bold text-red-800 mb-2">🔴 الجاني والمتفرج (للضحيه) — أوامر مباشرة</p>
              <p className="text-sm text-gray-700">الجاني: "روح اشرب" | المتفرج: "احضر الجروب"</p>
            </div>

            <div className="bg-green-50 rounded p-3 text-right">
              <p className="text-sm font-bold text-green-800 mb-2">🟢 الضحيه — رجاء ودعاء</p>
              <p className="text-sm text-gray-700">"أنا مش عاوز" | "ساعدني" | "أنا مش قادر أقاوم"</p>
            </div>

            <div className="bg-blue-50 rounded p-3 text-right">
              <p className="text-sm font-bold text-blue-800 mb-2">🔵 الجاني والمتفرج (مع بعض) — عن المبادئ</p>
              <p className="text-sm text-gray-700">"في حد بيبطل" | "المبادئ ما تتجزأ" | "ما فيش حد فاهم"</p>
            </div>
          </div>

          <p className="text-gray-700 text-right leading-relaxed mt-4">
            <strong>لما تسمع صوت بره راسك أو جوه راسك، اسأل نفسك:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-700 text-right space-y-1 mt-2">
            <li>هل هو أمر مباشر؟ (جاني أو متفرج)</li>
            <li>هل هو رجاء وضعف؟ (ضحيه)</li>
            <li>هل هو عن المبادئ؟ (جاني ومتفرج يتناقشان)</li>
          </ul>
        </div>

        {/* Theory Section */}
        {activeSection === 'theory' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-right mb-4">نظرية الصراع الداخلي والإدمان</h3>

              <div className="bg-blue-50 rounded p-4 text-right mb-4 space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>هذه أداة للتعامل مع الصراع الداخلي بين ثلاث أصوات:</strong>
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>الجاني</strong> = الفكرة المسيئة أو الحوار الداخلي القاسي الذي استدخلناه من الإساءة</li>
                  <li><strong>الضحيه</strong> = الذات الجريحة التي تستحق الحب والعناية</li>
                  <li><strong>المتفرج</strong> = الملاحظ الموضوعي الحكيم الذي يحكم بين الصوتين</li>
                </ul>
              </div>

              <p className="text-gray-700 text-right leading-relaxed mb-4">
                <strong>الهدف:</strong> بدلاً من كبت هذه الأصوات أو الهروب منها (عن طريق الانتكاسة)، نخرجها للعلن. هذا يساعد:
              </p>

              <div className="bg-red-50 rounded p-4 text-right space-y-2 mb-4">
                <p className="font-medium">✓ التعرف على الجاني كصوت خارجي</p>
                <p className="text-sm text-gray-700">تتعرف على أن هذا الصوت القاسي ليس أنت — إنه صوت خارجي استقر في رأسك من الإساءة والإدمان.</p>
              </div>

              <div className="bg-green-50 rounded p-4 text-right space-y-2 mb-4">
                <p className="font-medium">✓ تقوية صوت الضحية</p>
                <p className="text-sm text-gray-700">تقوي صوت الضحية — تتعلم أن تتحدث مع نفسك بعطف وتفهم بدلاً من القسوة والانتقاد.</p>
              </div>

              <div className="bg-blue-50 rounded p-4 text-right space-y-2 mb-4">
                <p className="font-medium">✓ تطوير صوت المتفرج الحكيم</p>
                <p className="text-sm text-gray-700">تطور صوت المتفرج الحكيم الذي ينصت لكلا الجانبين لكن ينحاز في النهاية للحقيقة والحماية.</p>
              </div>

              <div className="bg-amber-50 rounded p-4 text-right space-y-2">
                <p className="font-medium">✓ <strong>النتيجة:</strong></p>
                <p className="text-sm text-gray-700">تقليل قوة صوت الجاني، وتقوية الأمان الداخلي، وتقليل الرغبة في الانتكاسة والعودة للتعاطي.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-right mb-4">لماذا يعمل هذا؟</h3>
              <ul className="space-y-3 text-right">
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-gray-700">الأصوات المكبوتة تصبح أقوى وتدفعك للانتكاسة. عندما نخرجها، نضعف قوتها.</span>
                  <span className="text-2xl flex-shrink-0">💭</span>
                </li>
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-gray-700">الحوار الداخلي الواعي أقوى من الكبت اللاواعي.</span>
                  <span className="text-2xl flex-shrink-0">🗣️</span>
                </li>
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-gray-700">تقوية صوت الضحية يعني تقوية حب الذات والحماية والعناية بك.</span>
                  <span className="text-2xl flex-shrink-0">💚</span>
                </li>
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-gray-700">المتفرج يساعدك على رؤية الحقيقة بوضوح دون الانجراف بالعاطفة أو الرغبات الإدمانية.</span>
                  <span className="text-2xl flex-shrink-0">👁️</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* How To Section */}
        {activeSection === 'howto' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-right mb-4">الخطوات العملية</h3>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="border-r-4 border-blue-600 pr-4">
                  <h4 className="text-lg font-bold text-right text-blue-600 mb-2">الخطوة 1: كتابة الرسائل الأساسية</h4>
                  <p className="text-gray-700 text-right mb-2">
                    ابدأ بكتابة رسائل من كل صوت:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-right space-y-1 ml-4">
                    <li><strong>من الجاني إلى الضحية:</strong> اكتب الأفكار القاسية التي تسمعها</li>
                    <li><strong>من الضحية إلى الجاني:</strong> اكتب احتجاجك أو حدك</li>
                    <li><strong>من المتفرج إلى الجاني:</strong> اكتب الحقيقة والتحدي</li>
                    <li><strong>من المتفرج إلى الضحية:</strong> اكتب التحقق والدعم</li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div className="border-r-4 border-green-600 pr-4">
                  <h4 className="text-lg font-bold text-right text-green-600 mb-2">الخطوة 2: رصد أفكار الجاني يومياً (الواجب الرئيسي)</h4>
                  <p className="text-gray-700 text-right mb-2 font-medium">
                    <strong>هذا هو أهم جزء!</strong> كل يوم قم برصد أفكار الجاني:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-right space-y-1 ml-4">
                    <li><strong>اكتب أفكار الجاني:</strong> ما أقسى الأشياء اللي قالها الجاني ليك اليوم؟</li>
                    <li><strong>قيم الشدة:</strong> كم قوية هذه الأفكار على مقياس 1-10؟</li>
                    <li><strong>رد الضحية:</strong> ماذا يرد الضحيه عليه بلطف وضعف؟</li>
                    <li><strong>تحليل المتفرج:</strong> ما الحقيقة الموضوعية اللي يقولها المتفرج؟</li>
                  </ul>
                  <p className="text-sm text-gray-600 text-right mt-3">
                    بس بهذا الرصد اليومي، ستقدر تميز الأصوات وتفهم <strong>لغة كل شخصية</strong> وشنو اللي بتقول.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="border-r-4 border-purple-600 pr-4">
                  <h4 className="text-lg font-bold text-right text-purple-600 mb-2">الخطوة 3: البحث عن الأنماط</h4>
                  <p className="text-gray-700 text-right mb-2">
                    بعد أسبوع أو أسبوعين، ابحث عن الأنماط:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-right space-y-1 ml-4">
                    <li>أي الأفكار تعود مراراً؟</li>
                    <li>أي الأفكار لها شدة أعلى؟</li>
                    <li>ما الذي يثير هذه الأفكار؟</li>
                    <li>متى بدأت هذه الأفكار وهل ترتبط بنقاط ضعف محددة؟</li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div className="border-r-4 border-red-600 pr-4">
                  <h4 className="text-lg font-bold text-right text-red-600 mb-2">الخطوة 4: الاستخدام في الأزمات</h4>
                  <p className="text-gray-700 text-right mb-2">
                    عندما تشعر برغبة في الانتكاسة أو فكرة مسيئة شديدة:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-right space-y-1 ml-4">
                    <li>افتح هذه الأداة</li>
                    <li>اقرأ رسائل المتفرج الحكيمة التي كتبتها من قبل</li>
                    <li>تذكر أن هذا الصوت ليس أنت</li>
                    <li>قم بما يقوله المتفرج بدلاً من صوت الجاني</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-right mb-4">🌟 نصائح مهمة</h3>
              <ul className="space-y-2 text-gray-700 text-right">
                <li>✓ لا توجد إجابات "صحيحة" — اكتب ما تشعر به وليس ما تعتقد أنه يجب أن تشعر به</li>
                <li>✓ كلما كتبت أكثر، كلما أصبح الصوت الحقيقي أقوى وأكثر حماية</li>
                <li>✓ قد يكون صوت الجاني قاسياً جداً في البداية — هذا طبيعي تماماً</li>
                <li>✓ شارك هذا مع معالجك/طبيبك — هذا جزء مهم جداً من العلاج</li>
                <li>✓ تذكر: المثلث الشخصي ليس للحكم على نفسك — إنه لفهم نفسك وحمايتك من الانتكاسة</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Acknowledgement & Proceed */}
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="max-w-2xl mx-auto w-full space-y-3">
          <label className="flex items-start gap-3 cursor-pointer text-right">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="w-5 h-5 mt-1 flex-shrink-0"
            />
            <span className="text-gray-700">
              أفهم الأصوات الثلاثة وكيفية استخدام هذه الأداة. أنا مستعد لبدء كتابة رسائلي.
            </span>
          </label>
          <button
            onClick={handleProceed}
            disabled={!acknowledged}
            className={`w-full py-3 rounded-lg font-bold transition-colors ${
              acknowledged
                ? 'btn-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            ابدأ الآن — افتح المثلث الشخصي
          </button>
        </div>
      </div>
    </div>
  );
}
