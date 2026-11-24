/* ============================================================
   content.js  ——  这个网站所有「可替换内容」都放在这里
   ------------------------------------------------------------
   后面要换成你自己的内容，只改这个文件就够了：
     · 文案 / 姓名 / 联系方式 / 项目 / 卡片  → 直接改下面的文字
     · 图片                                → 改 assets 路径
     · 入口位置、颜色、动画                → 去 css/style.css
   注意：第一屏底图是 assets/bg-ginkgo-paper-hi-sharp.webp（1243×848，
        用户银杏插画浓树原版的高清裁切 + 轻锐化），由 tools/make_hires_paper.py
        从 2780×848 原图按 CROP_X0=936 裁出、不做缩小；CSS 仍按 865×590 显示，
        所以全屏放大时不会糊。旧低清版 bg-ginkgo-paper.webp(865×590) 保留。
        另有高清洗淡版 bg-ginkgo-paper-soft-hi.webp（中间 28%）和
        bg-ginkgo-paper-soft55-hi.webp（淡 55%），由 tools/soften_tree.py 生成；
        想换底图 / 树浓度只改 css/style.css 里 #v-loading 的背景文件名即可；
        第二页 / Demo 页仍是整张背景图（bg-home.png、bg-demo.png），
        换插画时直接替换同名文件即可，尺寸保持 865×590。
   ============================================================ */

window.SITE_CONTENT = {

  /* ---------- 首页 / 第一屏（加载页）----------
     D 方案「落叶进度」：银杏纸打底，黄色圆盘退成一层极淡暖光，
     加载进度 = 落叶铺满的过程（从树冠附近左右摇摆飘下 + 地面由稀到密 + 桌脚一小撮）。
     只改这里 + css/style.css 里同名的颜色变量；第二页完全不受影响。

     title      两行剪贴字，样式一比一复刻原版剪贴字（文案用 MY WORLD!）：
                每个字母一张手撕纸片（米白 / 淡粉 / 淡桃交替）、白色撕边、
                粉色错位影、粗黑手绘字，两行左右还有放射短线，上方一颗四角星
     titleStyle 剪贴字的所有颜色 / 尺寸 / 字体 / 每个字母的纸片宽度
                （font 换 'Lilita One' 可切回更圆润规整的一款）
     palette    整页取色（全部来自银杏插画），由 app.js 注入 CSS 变量
     halo       人物背后那层淡光的 [left, top, width, height]
     leaves     落叶数量、飘落距离、贴片文件（sprites 是从底图抠出的手绘银杏叶）
     character  64 帧人物位置：加大 rect[0] 往右移、加大 rect[1] 往下移    */
  loading: {
    label: 'LOADING my world',  // 复刻原版「LOADING my moon」的大小写节奏，world 换成自己的
    sub: '加载中',              // 进度跑动时，进度条下方的小字
    duration: 3200,            // 进度条跑完需要几毫秒；落叶同步铺满
    autoEnter: false,          // ★ false：跑满后停在首页，不自动跳；true：跑满自动进第二页
    showSkip: false,           // 旧版备用开关，现在不再使用：START! 从第一帧就常驻显示
    skip: '跳过 ›',             // 旧版备用文案，现在不再使用
    enter: 'START!',            // 常驻在进度条旁的纯文字按钮（无边框无底色），点它才进下一页
                                // 用半角 ! 而不是全角！：这款手绘字体没有中文标点，
                                // 半角才能让整句（含感叹号）都用上标题同款字体。
    readySub: '欢迎回来',       // 进度跑满后，进度条下方的小字
    title: ['WELCOME TO', 'MY WORLD!'],

    /* 剪贴字：一比一复刻原版手绘标题。
       font      本地字体（assets/fonts/），'Luckiest Guy' 歪扭更接近原版手绘；
                 换 'Lilita One' 是更圆润规整的备用款
       heights   height 纸片高 / fontSize 字号；改小整块标题会等比缩小
       widths    每个字母的纸片宽度：宽字母（W/M）纸片更宽，窄的更窄，
                 才不会像方格子；数值加大 = 该字母纸片变宽
       tones     纸片颜色，按顺序循环：米白 / 淡粉 / 淡桃
       ink/edge/shadow/ray/star  字色 / 白色撕边 / 粉红错位影 / 放射线 / 星星
       想要更「自己的主题色」：把 tones 里的粉换成银杏黄 #E6B422 即可。 */
    titleStyle: {
      font: 'Luckiest Guy',
      height: 60, fontSize: 64,
      widths: { W:57, M:51, E:38, L:34, C:42, O:44, T:38, Y:40, N:44, R:46, D:44, '!':22 },
      tones: ['#FBF4E4', '#F2A3BA', '#F6C3B2'],
      ink: '#241B18',
      edge: '#FFFCF2',
      shadow: 'rgba(206,66,124,.55)',
      ray: '#8A2E50',
      star: '#F6C64A',
      starInk: '#3E2723'
    },

    /* 标题逐字入场动画（等价于 React Bits 的 SplitText）。
       本站是纯静态原生站、没有 React，所以用原生 CSS+JS 在一张张手撕纸片上
       做出同样的「字母逐个揭示」效果，参数对照 SplitText 的 props：
         enabled      是否开启动画（false 则一上来就全部显示，回到老样子）
         effect       揭示方式：rise 从下方浮起 / fade 淡入 / pop 弹出 /
                      blur 由模糊到清晰 / flip 3D 翻起 / skew 斜着滑入 / wave 波浪
         delay        每个字母之间错开多少毫秒（对应 SplitText 的 delay）
         duration     单个字母动画时长毫秒（对应 duration）
         staggerFrom  从哪头开始：start 从左到右 / end 从右到左 / center 从中间 /
                      edges 从两端 / random 随机
         hover        鼠标靠近字母时轻微抬起（对应 hoverEffect="lift"）
       改完刷新即可看到；想换效果就改 effect 一个词。 */
    titleAnimation: {
      enabled: true,
      effect: 'rise',
      delay: 55,
      duration: 900,
      staggerFrom: 'start',
      hover: true
    },

    /* 想整套换色只改这里。来源：银杏插画取样
       纸 #F8E6CC / 叶 #EDB963 #E6B422 / 琥珀 #D89A3C / 树干 #B66B34 / 墨棕 #3E2723 */
    palette: {
      ink:        '#3E2723',   // 所有描边、文字、影子——「同一支笔」
      paper:      '#F8E6CC',   // 米白纸
      cutPaper:   '#FDF3DE',   // 剪贴字纸片
      haloCore:   '#FFF3D6',   // 淡光中心
      haloEdge:   '#F6CF90',   // 淡光外沿
      barTop:     '#F6D97A',   // 进度条填充
      barBottom:  '#E6B422',
      track:      '#FFFBF0',   // 进度条轨道
      wash:       '#F6CF90'    // 舞台外补边色
    },

    halo:   { rect: [352, 128, 400, 400] },

    /* 落叶：6 片（13 → 8 → 6），全部是从插画里抠出的手绘银杏扇叶贴片，
       颜色、描边、水彩质感跟底图自带落叶完全一致。
       压在桌子 / 人物前面的那两片已按用户要求拿掉，现在所有叶子都在
       人物后面，从树冠附近左右摇摆着飘下来，落地即静止。
       ground   地面散落 / pile 桌脚一小撮
       trimLeft 按落点 x 从小到大，去掉最左边 N 片（左边再留白一点）；
                只删这几片，其余叶子的位置 / 轨迹 / 出场时刻都不会重排
       fall     从多高的地方开始飘 / sway 左右摆幅 / turn 空中翻面快慢
       dur      单片飘落耗时（ms），每片都不一样才不会齐刷刷落下
       tints    一点点色差，避免 6 片看起来是同一张复制粘贴            */
    leaves: {
      ground: 6, pile: 2, trimLeft: 2, fall: [210, 330],
      sway: [26, 58], turn: [0.8, 1.6], dur: [1300, 1800],
      sprites: [
        'assets/leaf-ginkgo-1.png',
        'assets/leaf-ginkgo-2.png',
        'assets/leaf-ginkgo-3.png'
      ],
      tints: ['none', 'saturate(.88) brightness(1.04)', 'hue-rotate(-7deg)', 'saturate(1.08)']
    },
    character: {
      src: 'assets/character-64.webp',
      rect: [390, 205, 305, 305],
      frames: 64, cell: 512, cols: 8,
      maxSpeed: 48, follow: 0.07
    }
  },

  /* ---------- 首页四个手绘入口 ----------
     rect 是透明点击区在 865×590 舞台中的坐标 [left, top, width, height]
     tip  是鼠标悬停时出现的小标签                                  */
  home: {
    /* 第二页：手作菜单。图标直接贴在整屏水彩背景上（无纸片底）。
       2026-11-17 定稿：恢复四入口 + 日系卡通图标（跟中间女孩同画风，都带银杏叶）。
       图标由 ImageGen 以人物图为参考生成、脚本抠成透明底；顺序＝左上/右上/左下/右下，
       四角排布避开中间人物（人物占 x≈335~540、y≈97~533）。 */
    /* 2026-11-21 改版：人物放回正中，四卡散落左右两边（各两张），中间留白给她。
       问候语已按用户要求移除（greeting 置空即不渲染，字图留档可恢复）。 */
    greeting: "",
    greetingImages: {
      hi: 'assets/greeting-hi-hair.png',
      im: 'assets/greeting-im-hair.png',
      name: 'assets/greeting-lastname-hair.png'
    },
    entries: [
      // 四卡放大一号、左右错落散布（不刻意对齐）：左关于我/技能工具，右项目/实践
      { id: 'resume',    icon: 'about',    iconImg: 'assets/icon-cartoon-about.png?v=33',    label: '关于我',   en: 'ABOUT',    tip: '个人简历',   paper: '#FDF3DE', rot: -8, rect: [26, 92, 178, 174] },
      { id: 'skills',    icon: 'practice', iconImg: 'assets/icon-cartoon-practice.png?v=33', label: '校园经历', en: 'CAMPUS',   tip: '校园经历',   paper: '#F3E3B8', rot: 8,  rect: [646, 320, 178, 174] },
      { id: 'demo',      icon: 'projects', iconImg: 'assets/icon-cartoon-skills.png?v=34',   label: '项目经历', en: 'PROJECTS', tip: '项目经历',   paper: '#F8D9C6', rot: -6, rect: [668, 112, 178, 174] },
      { id: 'architect', icon: 'skills',   iconImg: 'assets/icon-cartoon-projects.png?v=34', label: '实践经历', en: 'PRACTICE', tip: '实践经历',   paper: '#FDF3DE', rot: 5,  rect: [56, 310, 178, 174] }
    ],
    // 原版中间的小人彩蛋已随粉色插画一起移除
    footer: [
      { text: '✦ 联系我', href: '#/contact' },
      { text: '✦ 更多', href: '#/more' }
    ]
  },

  /* ---------- 简历页 ---------- */
  resume: {
    eyebrow: 'RESUME · 2026',
    name: '赵怡迪',
    role: '统计学 · 大数据',
    photo: 'assets/portrait.png',
    actionText: '下载 PDF ↓',
    contact: [
      { k: '电话', v: '13781123056' },
      { k: '邮箱', v: 'zyd13781123056@126.com' }
    ],
    sections: [
      {
        title: '教育背景',
        rows: [
          { left: '中国农业大学 · 数据科学与大数据技术（二学位）', mid: '', right: '2026.09—2028.06' },
          { left: '北京林业大学（211）· 统计学（本科）', mid: '', right: '2022.09—2026.06' }
        ],
        notes: [
          '主修课程：数理统计、随机过程、回归分析、时间序列分析、经济预测与决策、市场营销学等。',
          '所获荣誉：「挑战杯」首都大学生课外学术科技作品竞赛三等奖、中国国际大学生创新大赛北京赛区高教主赛道校赛三等奖。'
        ]
      },
      {
        title: '实习经历',
        rows: [
          { left: '开封市市区供销合作社有限公司', mid: '统计实习生', right: '2026.01—2026.03' }
        ],
        notes: [
          '数据采集梳理：对接十余家基层经营网点，收集农资、消费品等进销存数据，完成数据清洗整合，统一报送标准。',
          '数据核算制表：编制月度、季度统计报表，核验并处理异常数据，满足企业日常经营上报要求。',
          '数据归档分析：完成统计资料规范化归档，基于业务数据开展基础分析，为采购与库存管理提供数据依据。'
        ]
      },
      {
        title: '项目经历',
        rows: [
          { left: '「正大杯」全国大学生市场调查与分析大赛', mid: '市场分析', right: '2023.10—2024.03' },
          { left: '慧病先知——帕金森智能预测平台', mid: '市场运营', right: '2024.10—2025.01' }
        ],
        notes: [
          '正大杯：设计发放问卷 800+ 份（回收率 96.56%），结合深度访谈定位客群需求；爬取评论 2167 条做情感与语义网络分析，提出「森林康养 +」分层策略，形成完整业务闭环。',
          '慧病先知：通过文献与竞品分析识别 3 大增量市场；参与设计三层盈利模式、覆盖 9 类收入来源，用 Xmind 搭建组织架构并制定三阶段运营路径。'
        ]
      },
      {
        title: '校园经历',
        rows: [
          { left: '北林青春传媒中心视频部', mid: '部长', right: '2022.09—2023.09' },
          { left: '五月剧社资源部', mid: '部长', right: '2023.09—2025.09' }
        ],
        notes: [
          '现场拍摄：参与校庆梁希演出、校运会等多项大型活动的现场拍摄，素材多次被校级官方视频采用。',
          '内容策划：结合校园热点与平台调性提出拍摄思路与脚本建议，提升视频内容传播效果。',
          '物资统筹与调度：负责 5+ 场演出的物资统筹与后台调度，保障演出流程顺畅。',
          '活动策划与执行：参与剧社纳新活动策划，吸引超 20 名新成员加入。'
        ]
      },
      {
        title: '专业技能',
        rows: [
          { left: '数据分析', mid: 'SPSS · Python · C', right: '' },
          { left: '办公', mid: 'Excel（透视表 / 函数 / 图表）· MS Office 二级', right: '' },
          { left: '语言', mid: '英语四级 500+ · 六级 500+ · 普通话一乙', right: '' }
        ]
      }
    ]
  },

  /* ---------- 项目经历 Demo 页 ---------- */
  demo: {
    // 项目经历内页：三张 3:4 手绘卡片。figure 留空=显示占位框；填入图片路径即替换配图。
    eyebrow: 'PROJECT JOURNEY · 2026',
    title: '项目经历',
    timeline: [
      { label: '2023.10 正大杯' },
      { label: '2024.10 慧病先知' },
      { label: '2026.01 统计实习' }
    ],
    cards: [
      {
        no: '01', title: '市场分析', sub: '全国大学生市场调查与分析大赛',
        stat: '问卷 800+ · 回收率 96.56%',
        accent: '#9C3A2E', tint: '#FBEDE7', figure: 'assets/resume-illustrations-v6/01-zhengda-cup-survey.png', rot: 0,
        detail: '• 用户调研：为研究北京市森林康养消费意愿与影响因素，设计并发放问卷 800+份，有效回收率 96.56%，结合深度访谈精准定位客群需求与消费动机，形成消费者行为画像，为策略制定提供核心依据。\n' +
          '• 数据驱动：爬取线上平台评论数据 2167 条，通过文本情感分析与语义网络分析，量化用户对环境、服务、产品的满意度，锁定核心痛点与高潜力市场机会。\n' +
          '• 策略落地：提出“森林康养 +”模式，为 3 类核心客群定制产品组合、阶梯定价及线上线下整合推广方案，形成可落地商业策略，助力项目完成完整业务闭环。'
      },
      {
        no: '02', title: '市场运营', sub: '帕金森智能预测平台 · 市场运营',
        stat: '3 大增量市场 · 9 类收入来源',
        accent: '#3E6E52', tint: '#EAF1E7', figure: 'assets/resume-illustrations-v6/02-parkinson-market.png', rot: 0,
        detail: '• 市场洞察：通过文献与竞品分析，识别个人风险评估、科研数据服务、保险投保预测 3 大增量市场，协助团队精准锁定目标用户，降低获客与运营成本。\n' +
          '• 商业模式：参与设计“订阅收费+增值服务+合作收入”三层盈利模式，覆盖 9 类收入来源，针对个人、科研机构、保险公司三类用户制定差异化付费策略，完成收入结构测算，提升方案可行性。\n' +
          '• 运营规划：用 Xmind 搭建组织架构，制定初期、中期、后期三阶段目标与资源配置方案，输出可执行运营路径，支撑项目从 0 启动。'
      },
      {
        no: '03', title: '统计实习', sub: '供销合作社 · 数据采集与分析',
        stat: '十余家网点 · 月度季度报表',
        accent: '#6B5B9A', tint: '#EEEAF6', figure: 'assets/resume-illustrations-v6/03-internship-data-scale.png', rot: 0,
        detail: '• 数据采集梳理：对接十余家基层经营网点，收集农资、消费品等进销存数据，完成数据清洗整合，统一报送标准。\n' +
          '• 数据核算制表：编制月度、季度统计报表，核验并处理异常数据，满足企业日常经营上报要求。\n' +
          '• 数据归档分析：完成统计资料规范化归档，基于业务数据开展基础分析，为采购与库存管理提供数据依据。'
      }
    ],
    figureHint: '配图占位',
    figureSize: '建议 4:3 · 240 × 180',
    tags: [],

    /* 项目经历文件夹（React Bits <Folder /> 的手作等价实现）。
       本站是纯静态原生站、没有 React；用原生 CSS+JS 在牛皮纸文件夹上做出
       同样的「点开 → 纸页散开 → 探出 → 点开放大 → 拖出拖回」交互。
         enabled     false 则退回原来的三张翻转卡片
         label      文件夹标签上的字
         caption    封面上的提示字
         hint       文件夹下方的小字说明
         color      牛皮纸主色（暖棕，配合全站主题）
         peek       未打开时鼠标靠近，纸页是否探出
         draggable  纸页能否拖出来 / 拖回去
         intro      进入页面时的落下入场动画 */
    folder: {
      enabled: false,
      label: '项目经历',
      caption: 'PROJECTS · 点击打开',
      hint: '点纸页看详情 · 拖出来摊在桌上 · 拖回文件夹',
      color: '#B98A5E',
      peek: true,
      draggable: true,
      intro: true
    },

    /* React Bits <Folder /> 原组件（一比一）配置。
       开启后 app.js 会用 window.ReactBitsFolder 在 #react-folder-host 里渲染真组件。
       这里的值直接对应组件 props，后续改细节只需改这里 + 重跑 tools/build_folder.js（若改了 jsx）。
       enabled     true 用 React 原组件；false 回退到 folder.enabled 或翻转卡
       items       三张纸页：{ image, title, alt }
       props       其余 props 原样透传给组件 */
    reactFolder: {
      enabled: false,
      label: '项目经历',
      mode: 'flap',
      variant: 'solid',
      color: '#E6B422',
      paperColor: '#FCF6E9',
      flipCards: true,
      tabPosition: 'right',
      layout: 'spread',
      size: 1.15,
      openOn: 'click',
      defaultOpen: false,
      draggable: true,
      zoomOnClick: true,
      peek: true,
      intro: false,
      tilt: 0.4,
      bounce: 0.4,
      speed: 1,
      theme: 'dark',
      items: [
        { image: 'assets/resume-illustrations-v6/01-zhengda-cup-survey.png', title: '正大杯 · 林业康养', alt: '正大杯林业康养研究' },
        { image: 'assets/resume-illustrations-v6/02-parkinson-market.png', title: '慧冰鲜知 · 健康项目', alt: '慧冰鲜知健康项目' },
        { image: 'assets/resume-illustrations-v6/03-internship-data-scale.png', title: '统计实习', alt: '供销合作社统计实习' }
      ]
    }
  },

  /* ---------- Skills 工具箱页 ---------- */
  skills: {
    eyebrow: 'XIARPOTTER · SKILLS LAB',
    title: '我的 Skills 工具箱',
    cards: [
      {
        no: '01', color: '#FBF6E9', title: '产品业务框架图', slug: 'product-framework-diagram-skill',
        desc: '生成可编辑的中文产品规划、业务流程与能力框架图。', btn: '查看 GitHub ↗', href: '#'
      },
      {
        no: '02', color: '#FBF6E9', title: '答辩与汇报模板', slug: 'report-deck-builder',
        desc: '快速生成答辩、述职与项目汇报的可编辑 PPT 和 PDF。', btn: '查看 GitHub ↗', href: '#'
      },
      {
        no: '03', color: '#FBF6E9', title: '虾仁文章配图', slug: 'personal-ip-illustrations',
        desc: '为中文文章生成统一虾仁 IP 风格的手绘正文配图。', btn: '查看 GitHub ↗', href: '#'
      },
      {
        no: '04', color: '#FBF6E9', title: '虾仁 IP 表情包', slug: 'custom-ip-sticker-maker',
        desc: '创建虾仁 IP 三视图、主题表情包、封面与引导表情。', btn: '查看 GitHub ↗', href: '#'
      }
    ]
  },

  /* ---------- 实践经历页（个人信息 md 第七节「实践 / 志愿经历」4 条） ---------- */
  practice: {
    eyebrow: 'PRACTICE · 实践经历',
    title: '把事情真正落地',
    cards: [
      {
        no: '01', color: '#F7E3D9', time: '2024.07–08', role: '支教志愿者',
        title: '科右前旗线上支教',
        points: [
          '一对一线上辅导数学、物理、历史',
          '累计 15 次以上（每次 ≥45 分钟）',
          '自拟「复习–巩固–预习」分阶段教学计划'
        ]
      },
      {
        no: '02', color: '#E7EFE2', time: '暑期', role: '调研成员',
        title: '黄化门社区养老调研',
        points: [
          '入户访谈社区老人 30 余户',
          '回收问卷与访谈记录 90 余份',
          '支撑近万字报告及一篇论文',
          '获暑期社会实践三等奖'
        ]
      },
      {
        no: '03', color: '#E9E4F2', time: '2023.10', role: '赛事服务与后勤',
        title: '北京马拉松志愿者',
        points: [
          '饮水站成员，服务数千名跑者',
          '饮水补给高效无误',
          '站点零中断、零混乱'
        ]
      },
      {
        no: '04', color: '#F6E7C8', time: '2023.08.27', role: '志愿者组长',
        title: '演唱会项目执行',
        points: [
          '线上组队、信息登记与名单核对',
          '独立完成押金收取、登记、核对、退款全流程',
          '账实相符零差错',
          '发布通知保障到岗率'
        ]
      }
    ]
  },

  /* ---------- 校园经历页（个人信息 md 第六节「校园经历」2 条） ---------- */
  campus: {
    // 与项目经历同款翻转卡结构：时间轴 + 2 张 3:4 卡 + 底部标签
    eyebrow: 'CAMPUS JOURNEY · 校园经历',
    title: '在校园里忙些喜欢的事',
    timeline: [
      { label: '2022.09 视频部' },
      { label: '2023.09 剧社' }
    ],
    cards: [
      {
        no: '01', title: '视频部', sub: '北林青春传媒中心 · 干事',
        stat: '2022.09 – 2023.09',
        accent: '#9C3A2E', tint: '#FBEDE7', figure: 'assets/campus-video.webp?v=3', rot: 0,
        detail: '• 现场拍摄：参与校庆梁希演出、校运会等大型活动现场拍摄，素材多次被校级官方视频采用。\n' +
          '• 选题脚本：参与选题研讨，结合校园热点与公众号 / 视频号调性提出拍摄思路与脚本建议。'
      },
      {
        no: '02', title: '资源部', sub: '五月剧社 · 部长',
        stat: '2023.09 – 2025.09',
        accent: '#3E6E52', tint: '#EAF1E7', figure: 'assets/campus-drama.webp?v=3', rot: 0,
        detail: '• 演出统筹：负责 5+ 场演出的物资统筹与后台调度，提前备好物料清单、与演员及舞台组沟通保障演出落地。\n' +
          '• 纳新策划：参与纳新活动策划，吸引 20+ 名新成员加入。'
      }
    ],
    tags: []
  },

  /* ---------- 建筑作品集页 ---------- */
  architect: {
    eyebrow: 'ARCHITECTURE PORTFOLIO',
    title: '建筑作品集 · 2020—2023',
    works: [
      { src: 'assets/work-01.png', caption: '01 / 作品集跨页 · 展览空间' },
      { src: 'assets/work-02.png', caption: '02 / 总平面与轴测' },
      { src: 'assets/work-03.png', caption: '03 / 室内与立面研究' },
      { src: 'assets/work-04.png', caption: '04 / 排版与图纸集' }
    ]
  },

  /* ---------- 联系我页（深色舞台 + 3D 工牌） ----------
     工牌正面=用户 IP 形象证件照+姓名，背面联系方式，可拖拽甩动、点击翻面。
     卡面贴图由 tools/make_lanyard_data.py 生成，data URL 存在 lanyard-data.js。
     enabled:false 则只留深色舞台和提示文字；改外观调下面这些参数。 */
  contact: {
    /* 工牌参数回归 React Bits 原版默认值（一比一复刻组件本体的观感与手感），
       只有卡面贴图（IP 证件照 + 姓名 + 联系方式）是用户自己的内容。
       想微调：size=卡片高度占比、strapLength=挂绳长短、breeze=摆动幅度。 */
    lanyard: {
      enabled: true,
      frontImage: window.LANYARD_FRONTIMG || '',
      backImage: window.LANYARD_BACKIMG || '',
      strapImage: window.LANYARD_STRAPIMG || '',  // 低调织纹带；置 '' 则用 strapColor 纯色
      imageFit: 'cover',
      cardColor: '#ffffff',   // 原版默认纯白卡面
      orientation: 'portrait',
      finish: 'glossy',       // 原版默认亮面反光 glossy
      cornerRadius: 0.3,      // 原版默认圆角
      size: 0.6,              // 全屏下卡片高度占比（原版 0.6，调小一档）
      anchor: 'center',
      strapLength: 0.42,      // 原版 0.5，略收紧让卡片居中偏上
      strapColor: '#111111',  // 原版默认深黑挂绳
      strapWidth: 0.65,       // 原版默认带宽
      metal: 'silver',        // 原版默认银色夹子
      gravity: 1,
      damping: 0.5,           // 原版默认
      elasticity: 0.5,        // 原版默认
      breeze: 0.5,            // 原版默认微风摆动
      interactive: true,
      intro: true
    }
  },

  /* ---------- 更多页：弧形画廊（五张生活照） ----------
     使用 React Bits 开源组件 <CircularGallery />（原生 WebGL2，免费源码）。
     图片数据由 js/parallax-data.js 提供（data URL，规避 file:// 的 WebGL CORS）。
     注意：grayscale 必须为 false，图片不加任何滤镜。 */
  more: {
    eyebrow: 'MORE · 生活碎片',
    title: '一些瞬间',
    hint: '↔ 拖动或滚动翻看 · 点一下看大图',
    carousel: {
      // items: { image, text } —— text 是卡片下方标题
      items: (function () {
        var imgs = window.PARALLAX_IMAGES || [];
        var caps = window.PARALLAX_CAPTIONS || [];
        return imgs.map(function (src, i) {
          return { image: src, text: caps[i] || ('瞬间 ' + (i + 1)) };
        });
      })(),
      bend: 3,                  // 弧形弯曲：正=两端下垂
      itemSize: 1,              // 卡片高度相对容器
      itemAspect: 0.78,         // 宽高比（约 3:4 竖卡）
      gap: 0.26,                // 卡片间距（占卡宽比例）
      borderRadius: 0.05,       // 圆角
      wave: 1,                  // 移动时的波纹起伏
      fadeEdges: 0.12,          // 左右边缘淡出
      shadow: 0.25,             // 卡片下方柔和阴影
      textColor: '#FDF3DE',     // 标题色：米白（深色底上看得清，与联系页一致）
      font: 'bold 30px "ZCOOL KuaiLe", "Microsoft YaHei", sans-serif', // 中文字体
      showTitles: false,        // 卡片下方不加中文标题（用户要求只留图片）
      scrollSpeed: 2,
      scrollEase: 0.05,
      snap: true,               // 停在最近一张
      autoScroll: 0.35,         // 缓慢自动漂移
      openOnClick: true,        // 点击放大看大图
      grayscale: false,         // ★ 图片不加滤镜，保持原色
      intro: true
    }
  }
};
