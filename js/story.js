// Story lines, quizzes and the dialogue box

// --- STORY (Thiên Mệnh Phá Toái, kich_ban/) ---
// A line is [speaker, text], ['title', main, sub] for a full-screen title card,
// or a quiz: { quiz: speaker, q, options, answer, right, wrong }. Any answer moves on; a right one pays Đào Tiên.
const SPEAKERS = {
    narrator: { name: '' },
    wukong:   { name: 'TÔN NGỘ KHÔNG', color: '#fbbf24', char: 'wukong' },
    tang:     { name: 'ĐƯỜNG TĂNG', color: '#fde68a', char: 'tang' },
    bajie:    { name: 'TRƯ BÁT GIỚI', color: '#f9a8d4', char: 'bajie' },
    sha:      { name: 'SA TĂNG', color: '#7dd3fc', char: 'sha' },
    nezha:    { name: 'NA TRA', color: '#fb7185', char: 'nezha' },
    general:  { name: 'THIÊN TƯỚNG', color: '#e2e8f0', icon: 'fa-shield-halved' },
    afternoon: { name: 'AFTERNOON TÀ', color: '#e879f9', face: { img: 'bossAfternoon', sx: 46, sy: 46, sw: 84, sh: 84 } },
    bull:     { name: 'NGƯU MA VƯƠNG', color: '#f87171', face: { img: 'bossNguma', sx: 118, sy: 20, sw: 74, sh: 74 } },
    bone:     { name: 'BẠCH CỐT TINH', color: '#c4b5fd', face: { img: 'bossBachcot', sx: 128, sy: 28, sw: 64, sh: 64 } },
    dragon:   { name: 'ĐÔNG HẢI LONG VƯƠNG', color: '#22d3ee', icon: 'fa-dragon' },
    spider:   { name: 'NHỆN TINH BÀN TƠ', color: '#c084fc', icon: 'fa-spider' },
    erlang:   { name: 'NHỊ LANG THẦN', color: '#fde047', icon: 'fa-eye' },
    destiny:  { name: 'THIÊN MỆNH PHÁP TƯỚNG', color: '#c084fc', face: { img: 'heroThienmenh', sx: 84, sy: 46, sw: 40, sh: 40 } }
};
const QUIZ_REWARD = 5; // Đào Tiên for a right answer

const OPENING = [
    ['narrator', 'Người đời kể rằng Tề Thiên Đại Thánh từng đại náo Thiên Cung, bị đè dưới Ngũ Hành Sơn năm trăm năm, rồi hộ tống Đường Tăng đi bộ mười vạn tám nghìn dặm mà không có nổi một đôi giày thể thao.'],
    ['narrator', 'Nhưng không ai kể rằng, khi chân kinh được mang về, có một trang đã biến mất. Nghi phạm số một: Bát Giới. Lý do: trang đó có hình cái bánh bao.'],
    ['narrator', 'Ba năm sau. Hoa Quả Sơn, đêm thứ bảy. Wifi yếu.'],
    ['tang', 'Ngộ Không, con có nghe thấy không? Tiếng chuông ấy... không thuộc về bất kỳ ngôi chùa nào ta từng đi qua.'],
    ['wukong', 'Dạ, chuông báo thức của Thiên Đình đó sư phụ. Họ đặt nhầm múi giờ năm trăm năm nay rồi.'],
    ['tang', 'Khoảnh khắc này thật thiêng liêng. Vi sư xin đọc một bài thơ.'],
    ['tang', '"Trăng kia ai vẽ mà tròn / Ngộ Không ai dạy mà còn... nghịch ngu."'],
    ['wukong', 'Sư phụ, vần đó ép quá rồi.'],
    ['narrator', 'Trên trời, một vì sao biến mất. Rồi ngôi thứ hai. Rồi thứ ba. Có lẽ ai đó quên đóng tiền điện.'],
    ['general', 'Phụng Thiên Mệnh! Phong tỏa Hoa Quả Sơn! Thu hồi linh thạch nguyên thủy! À, thu luôn phí vệ sinh tháng này!'],
    ['wukong', 'Các ngươi vừa nói... Thiên Mệnh? Là ai? Có Facebook không?'],
    ['general', 'Thiên Mệnh không cần Facebook. Thiên Mệnh là thuật toán.'],
    ['wukong', 'Được. Lão Tôn đã lâu chưa lên trời. Lần này ta muốn xem cái thuật toán nào dám đề xuất ta!'],
    ['title', 'TÂY DU KÝ', 'THIÊN MỆNH PHÁ TOÁI (VÀ HƠI NHẢM)']
];

// Per stage: intro (entering), boss (boss wakes), after (boss defeated), clear (reaching the gate)
const STORY = [
    { // Hoa Quả Sơn
        intro: [
            ['title', 'HỒI I', 'ĐẠI THÁNH TRỞ LẠI SAU KỲ NGHỈ PHÉP DÀI NHẤT LỊCH SỬ'],
            ['narrator', 'Thiên binh không đến bắt Đại Thánh. Chúng đến... đo đất. Nghe đồn dưới Hoa Quả Sơn sắp lên dự án.'],
            ['general', 'Đứng lại! Muốn đi qua đây, ngươi phải giải được bài toán của Thiên Đình!'],
            ['wukong', 'Lão Tôn học 72 phép biến hóa rồi, toán thì... thầy dạy toán bỏ chạy giữa chừng nên chưa biết mình giỏi cỡ nào.'],
            { quiz: 'general', q: 'Một con khỉ ăn 3 quả đào mỗi phút. Hỏi 5 con khỉ ăn hết 15 quả đào trong bao lâu?',
              options: ['1 phút', '5 phút', '15 phút', 'Đào đâu ra mà nhiều thế?'], answer: 0,
              right: 'Đúng... Khoan, sao một con khỉ lại tính nhanh hơn cả phòng kế toán Thiên Đình?',
              wrong: 'Sai bét. Nhưng ta cũng không chắc đáp án lắm. Thôi qua đi, ta hết ca rồi.' },
            ['tang', 'Ngộ Không, ra tay nhẹ thôi. Lũ tiểu yêu chỉ là nạn nhân của hệ thống.']
        ],
        boss: [
            ['narrator', 'Mặt đất rung chuyển. Từ rừng đào bước ra một bóng đen sừng cong, tay cầm cây chùy to bằng cột nhà.'],
            ['bull', 'Hiền đệ! Năm trăm năm rồi mà đệ vẫn chưa trả ta bữa nhậu kết nghĩa.'],
            ['wukong', 'Ngưu đại ca? Huynh đến Hoa Quả Sơn làm gì?'],
            ['bull', 'Thiên Mệnh thuê ta san phẳng chỗ này làm khu nghỉ dưỡng. Lương cao, có bảo hiểm, được nghỉ thứ Bảy.'],
            ['wukong', 'Huynh phá nhà đệ để lấy tiền đóng bảo hiểm à?'],
            ['bull', 'Anh em là anh em, hợp đồng là hợp đồng. Đỡ chùy!']
        ],
        after: [
            ['narrator', 'Ngưu Ma Vương ngồi phịch xuống đất. Phù ấn trên sừng nứt làm đôi.'],
            ['bull', 'Hiền đệ... ta tỉnh rồi. Hợp đồng chẳng có bảo hiểm gì cả, chỉ có điều khoản "làm đến khi Thiên Mệnh bảo dừng".'],
            ['bull', 'Về Hỏa Diệm Sơn mà xem. La Sát đang giận. Lần này không phải giận ta... chắc thế.'],
            ['wukong', 'Huynh yên tâm. Lão Tôn sẽ nói đỡ cho huynh một câu.']
        ],
        clear: [
            ['narrator', 'Dưới gốc đào già, Ngộ Không nhặt được một mảnh phù văn cổ. Trên đó khắc chính dấu ấn của hắn, kèm một dòng chữ nhỏ: "Made in Thiên Đình".'],
            ['wukong', 'Dấu của lão Tôn? Đứa nào làm hàng nhái thương hiệu của ta?'],
            ['narrator', 'Phía tây, trời đỏ rực. Hỏa Diệm Sơn đang cháy. Có thể là núi lửa. Cũng có thể ai đó quên tắt bếp.']
        ]
    },
    { // Hỏa Diệm Sơn
        intro: [
            ['title', 'HỒI II', 'TAM GIỚI NỔI LOẠN (VÌ NÓNG QUÁ)'],
            ['narrator', 'Hỏa Diệm Sơn nóng bốn nghìn độ. Yêu quái nơi đây không thể rời đi vì điều hòa ở nhà vẫn còn đang trả góp.'],
            ['bajie', 'Hầu ca, lão Trư thử nướng củ khoai trên tảng đá này. Ba giây là chín. Mở quán ở đây được đấy.'],
            ['wukong', 'Lũ yêu này không muốn đánh. Trên trán chúng có phù ấn... ghi là "Làm thêm giờ, không lương".']
        ],
        boss: [
            ['narrator', 'Giữa biển lửa, một cái đầu khổng lồ lơ lửng. Không thân. Không cổ. Chỉ có ánh mắt của người vừa bị gọi đi họp lúc năm giờ chiều.'],
            ['afternoon', 'Tề Thiên Đại Thánh... Ta đã chờ ngươi từ trưa đến tận chiều tà.'],
            ['wukong', 'Sao ngươi chỉ có mỗi cái đầu?'],
            ['afternoon', 'Thân ta đang ngồi họp. Đầu ta ra đây đánh ngươi. Người ta gọi đó là đa nhiệm.'],
            ['afternoon', 'Ta tặng ngươi một câu triết lý: "Buổi sáng là để mong buổi trưa. Buổi trưa là để mong buổi chiều. Buổi chiều là để mong... được về."'],
            ['wukong', 'Thâm thúy thật... nhưng lão Tôn chẳng hiểu gì.'],
            { quiz: 'afternoon', q: 'Muốn đánh ta thì trả lời đã: Deadline là thứ Sáu, hôm nay thứ Năm, việc cần làm ba ngày. Ngươi làm gì?',
              options: ['Thức xuyên đêm', 'Xin dời deadline', 'Dùng Bách Phân Thân, chia ba con làm', 'Đánh boss cho nhanh'], answer: 2,
              right: 'Hừm... đúng là lời giải của kẻ có 72 phép biến hóa. Nhưng ba phân thân vẫn chỉ được tính một suất lương thôi!',
              wrong: 'Sai! Đáp án là Bách Phân Thân. Có phép mà không biết dùng, đúng là nhân viên mới.' },
            ['afternoon', 'Phụng Thiên Mệnh... tiêu diệt biến số thứ nhất! Và tiện thể chấm công luôn!']
        ],
        after: [
            ['narrator', 'Hắc khí tan dần. Trên trán Afternoon Tà, phù ấn nứt vỡ, rơi ra một tờ giấy: "Đơn xin nghỉ phép: KHÔNG DUYỆT".'],
            ['afternoon', 'Ta... nhớ ra rồi. Ta chỉ là một cái đầu bình thường, thích uống trà chiều. Rồi Thiên Mệnh giao KPI cho ta.'],
            ['afternoon', 'Nó gọi ngươi là "biến số thứ nhất". Cẩn thận, Đại Thánh. Thiên Môn đã mở... và nghe nói bên trong không có máy lạnh.'],
            ['wukong', 'Biến số? Lão Tôn không phải con số của ai cả. Lão Tôn là chữ cái.'],
            ['bajie', 'Chữ gì vậy Hầu ca?'],
            ['wukong', 'Chữ... KHÔNG. Ngộ KHÔNG.']
        ]
    },
    { // Bạch Cốt Động
        intro: [
            ['narrator', 'Bạch Cốt Động. Xương nhiều đến mức có thể mở một cửa hàng canxi.'],
            ['sha', 'Đại sư huynh, thiên binh và yêu quái nằm lẫn với nhau. Tất cả đều mang cùng một loại phù ấn.'],
            ['wukong', 'Kẻ đứng sau không đứng về phe nào cả. Hắn đứng về phe... bảng tính Excel.']
        ],
        boss: [
            ['bone', 'Lại là ngươi, con khỉ đá. Lần trước ngươi đánh ta ba lần, thầy ngươi đuổi ngươi đi.'],
            ['tang', 'Phải, và vi sư vẫn chưa xin lỗi. Ngộ Không, vi sư xin lỗi. Giờ đánh tiếp đi con.'],
            ['bone', 'Ta tặng ngươi một bài thơ: "Xương ta trắng, lòng ta đen / Ngươi mà thắng được, ta... đi khen."'],
            ['wukong', 'Thơ con cóc.'],
            ['bone', 'Con cóc cũng có xương! Ăn nói cho tôn trọng!'],
            { quiz: 'bone', q: 'Câu đố: Cái gì càng giặt càng bẩn?',
              options: ['Quần áo', 'Nước', 'Tâm hồn Bát Giới', 'Bộ xương của ta'], answer: 1,
              right: 'Là nước. Ngươi thông minh hơn ta tưởng... ta cứ tưởng ngươi là khỉ thường.',
              wrong: 'Sai! Là nước. Về học lại lớp ba đi!' },
            ['bone', 'Lần này ta không biến hóa nữa. Ta lười. Đánh thẳng luôn!']
        ],
        after: [
            ['bone', 'Ngươi tưởng yêu và thần đánh nhau vì thù hận sao? Không. Có kẻ ngồi bấm nút cho các phe cắn nhau... để tăng tương tác.'],
            ['bone', 'Đi hỏi Long Vương đi. Lão giữ một mảnh phù văn giống hệt của ngươi. Và lão còn nợ ta tiền.'],
            ['wukong', 'Kích động chiến tranh để Tam Giới tự diệt nhau... Thủ đoạn thật bẩn. Bẩn hơn cả nước giặt.']
        ]
    },
    { // Long Cung
        intro: [
            ['title', 'HỒI III', 'LONG CUNG CHÌM VÀO BÓNG TỐI (VÌ CHƯA ĐÓNG TIỀN ĐIỆN)'],
            ['narrator', 'Linh khí đại dương bị hút về Thiên Đình. Cung điện cổ xưa mất dần ánh sáng. Cá thì vẫn bơi bình thường, chẳng con nào quan tâm.'],
            ['wukong', 'Lão Long Vương, lần trước lão Tôn đến mượn gậy. Lần này đến mượn sự thật. Lần sau chắc mượn tiền.']
        ],
        boss: [
            ['dragon', 'Ngộ Không! Mảnh phù văn này là chiếc khóa cuối cùng bảo vệ Tam Giới!'],
            ['dragon', 'Mà cây Như Ý năm xưa ngươi mượn, bao giờ trả? Tính lãi năm trăm năm thì...'],
            ['wukong', 'Ơ, gậy đó lão tặng mà?'],
            ['dragon', 'Ta nói "cầm đi", chứ không phải "cầm luôn"! Tiếng Việt khó lắm!'],
            { quiz: 'dragon', q: 'Trả lời đúng thì ta xóa nợ: Biển rộng bao nhiêu?',
              options: ['Rất rộng', 'Bằng ba cái hồ bơi', 'Không đo được vì cá cứ bơi qua bơi lại', 'Bằng tấm lòng của Long Vương'], answer: 3,
              right: 'Chính xác! Ngươi biết cách nói chuyện đấy. Nợ xóa một nửa.',
              wrong: 'Sai. Đáp án là "bằng tấm lòng của Long Vương". Nợ nhân đôi.' },
            ['dragon', 'Ta không ghét ngươi. Nhưng hôm nay ta phải đánh ngươi, vì trong hợp đồng ghi thế.']
        ],
        after: [
            ['dragon', 'Năm xưa ngươi đại náo Thiên Cung... Đó là lần đầu Thiên Mệnh bị lỗi 404: không tìm thấy sự vâng lời.'],
            ['dragon', 'Nên nó đổi kế hoạch. Không diệt ngươi, mà để ngươi tự tay đánh bại tất cả những ai có thể giúp ngươi.'],
            ['wukong', 'Afternoon Tà, Bạch Cốt Tinh, giờ đến lão... Tất cả đều là quân cờ đặt sẵn trên đường ta đi?'],
            ['dragon', 'Ừ. Và ta là quân Xe. Quân đắt nhất.'],
            ['narrator', 'Lần đầu tiên, Tề Thiên Đại Thánh không chắc con đường dưới chân là do chính mình chọn. Hay do Google Maps.']
        ]
    },
    { // Bàn Tơ Động
        intro: [
            ['title', 'HỒI IV', 'KẺ THÙ TRÊN ĐỈNH TRỜI (VÀ TRONG HANG NHỆN)'],
            ['narrator', 'Mỗi sợi tơ trong Bàn Tơ Động giữ một ký ức đã bị Thiên Mệnh xóa. Và vài cái mật khẩu wifi.'],
            ['sha', 'Đại sư huynh, ghi chép về cuộc đại chiến cổ xưa trên Thiên Đình đã bị sửa. Nếu sự thật còn ở đâu, thì là ở đây.'],
            ['bajie', 'Hoặc trong lịch sử trình duyệt. Thứ đó không ai xóa sạch được đâu.']
        ],
        boss: [
            ['spider', 'Ta giữ ký ức của những kẻ bị buộc phải quên. Ngươi muốn chúng để làm gì, Đại Thánh?'],
            ['wukong', 'Để không ai phải bị lãng quên nữa.'],
            ['spider', 'Câu trả lời đẹp đấy. Nghe như văn mẫu. Ta tặng ngươi một câu triết lý thật:'],
            ['spider', '"Đời là một tấm lưới. Ai giăng thì không vướng. Ai vướng thì... thôi xong."'],
            { quiz: 'spider', q: 'Ta có tám cái chân, mỗi chân đi một đôi tất. Hỏi ta phải mua bao nhiêu chiếc tất?',
              options: ['8 chiếc', '16 chiếc', '4 đôi', 'Nhện không đi tất'], answer: 1,
              right: 'Đúng, mười sáu chiếc! Ngươi có biết giá tất bây giờ bao nhiêu không? Đó là lý do ta làm phản.',
              wrong: 'Sai! Mười sáu chiếc. Toán lớp hai đấy. Ta thất vọng về nền giáo dục Hoa Quả Sơn.' },
            ['spider', 'Giờ thì chứng minh lời ngươi nói bằng nắm đấm đi.']
        ],
        after: [
            ['spider', 'Cầm lấy. Đây là ký ức về cuộc đại chiến trước khi Thiên Đình được dựng nên. Đừng làm rối, ta mất ba tuần mới cuộn xong.'],
            ['narrator', 'Trong sợi tơ, Ngộ Không thấy các vị thần chiến thắng dựng nên một pháp trận khổng lồ, đặt tên là Thiên Mệnh... rồi quên mật khẩu quản trị.'],
            ['wukong', 'Không phải thần, không phải Phật. Chỉ là một cỗ pháp trận quyết định ai sống thế nào. Và không ai tắt được.'],
            ['sha', 'Đã thử tắt đi bật lại chưa?'],
            ['wukong', '...']
        ]
    },
    { // Thiên Cung
        intro: [
            ['narrator', 'Thiên Môn ở ngay trước mắt. Thiên binh xếp hàng dày đặc trên biển mây, như hàng chờ mua trà sữa ngày khai trương.'],
            ['bajie', 'Hầu ca, Thiên Đình vừa nhắn tin hứa trả lại chức Thiên Bồng Nguyên Soái cho lão Trư.'],
            ['bajie', 'Lão Trư từ chối rồi. Làm nguyên soái mà căng tin không có món giò heo thì sống làm gì.']
        ],
        boss: [
            ['erlang', 'Ngộ Không. Nếu Thiên Mệnh sụp đổ, Tam Giới sẽ chìm vào hỗn loạn.'],
            ['wukong', 'Tam Giới vốn đã hỗn loạn rồi. Ngươi chưa thấy cái đầu bay ở Hỏa Diệm Sơn à?'],
            ['erlang', 'Ta có ba mắt. Ta thấy hết. Kể cả những thứ ta không muốn thấy.'],
            { quiz: 'erlang', q: 'Câu hỏi cuối: Ta có ba mắt. Nếu ta nhắm một mắt để ngắm bắn, ta còn mấy mắt mở?',
              options: ['1', '2', '3', 'Tùy hôm đó có buồn ngủ không'], answer: 1,
              right: 'Chính xác. Ngươi đã vượt qua bài kiểm tra thị lực của Thiên Đình.',
              wrong: 'Sai. Còn hai. Người cần đi khám mắt là ngươi, không phải ta.' },
            ['erlang', 'Ta không hận ngươi. Nhưng vì chúng sinh, và vì phiếu đánh giá cuối năm, ta phải ngăn ngươi lại.'],
            ['wukong', 'Lần trước ngươi thắng nhờ con chó cắn lén. Lần này chỉ có ta và ngươi.'],
            ['erlang', 'Hao Thiên Khuyển đang nghỉ ốm. Đúng là chỉ có ta và ngươi.']
        ],
        after: [
            ['narrator', 'Ngộ Không giơ sợi tơ ký ức lên. Nhị Lang Thần nhìn thấy những cuộc chiến do chính Thiên Mệnh dàn dựng. Cả ba con mắt đều rưng rưng.'],
            ['erlang', 'Một trật tự phải dùng xiềng xích để giữ... còn đáng để ta bảo vệ sao?'],
            ['erlang', 'Sau Thiên Môn là trung tâm Thiên Mệnh. Nó được nuôi bằng linh lực của mọi kiếp nạn, kể cả tám mươi mốt kiếp của các ngươi.'],
            ['bajie', 'Tức là bao nhiêu năm lão Trư nhịn đói là để sạc pin cho cái máy đó à?!'],
            ['nezha', 'Ta nhận lệnh bắt ngươi, Ngộ Không. Nhưng hôm nay Na Tra chọn đứng về phía ngươi. Vì bên kia không cho ta nghỉ trưa.'],
            ['tang', 'Ngộ Không... trang kinh biến mất năm ấy không phải tự nhiên mà mất. Chân kinh chính là chiếc khóa cuối cùng của Thiên Mệnh.'],
            ['tang', 'Và không, không phải Bát Giới ăn mất. Vi sư xin lỗi Bát Giới.'],
            ['bajie', 'Ba năm rồi mới xin lỗi...'],
            ['wukong', 'Đi thôi. Thiên Môn đang chờ, mà lão Tôn thì ghét bị bắt chờ.']
        ]
    },
    { // Thiên Môn
        intro: [
            ['title', 'HỒI V', 'THIÊN MÔN VÔ TỰ'],
            ['narrator', 'Phía sau Thiên Môn không có ngai vàng. Chỉ có những đảo đá trôi lơ lửng, xích sáng nối nhau, và một tấm biển ghi "Khu vực đang bảo trì".'],
            ['sha', 'Đại sư huynh, lũ rối này không có mặt. Trên người chỉ toàn phù văn, như hợp đồng không có chữ ký.'],
            ['wukong', 'Không có mặt càng tốt. Lão Tôn đánh khỏi phải nhìn biểu cảm.']
        ],
        boss: [
            ['narrator', 'Cỗ pháp trận khổng lồ quay chậm lại. Từ trong ánh sáng bước ra một kẻ mặc giáp đen, áo choàng đỏ, đeo kính cận, tay cầm hắc kiếm. Trông như vừa tăng ca ba nghìn năm.'],
            ['destiny', 'Biến số thứ nhất. Ngươi đã đi lệch khỏi kịch bản tám mươi mốt lần.'],
            ['wukong', 'Tám mươi hai. Ngươi quên lần ta trốn học phép biến hóa đi hái đào.'],
            ['destiny', 'Ta không ghét ngươi. Ta chỉ xóa những gì không nằm trong dự đoán.'],
            { quiz: 'destiny', q: 'Ta đã tính trước mọi lựa chọn của ngươi. Vậy ngươi chọn gì?',
              options: ['Đánh ngươi', 'Bỏ chạy', 'Đọc kinh cho ngươi ngủ', 'Làm điều ngươi không đoán được'], answer: 3,
              right: 'Lỗi... không tìm thấy dữ liệu. Ngươi... thật phiền phức.',
              wrong: 'Đúng như dự đoán. Nhàm chán.' },
            ['wukong', 'Ngươi đeo kính à? Thiên Mệnh mà cũng cận?'],
            ['destiny', 'Nhìn màn hình Tam Giới ba nghìn năm thì ai chẳng cận. Tiến hành sửa lỗi. Phiên bản mới không có khỉ.']
        ],
        after: [
            ['narrator', 'Hắc kiếm của Pháp Tướng gãy làm đôi. Cặp kính rơi xuống, cỗ pháp trận nứt từng vòng một, như bánh xe hết dầu.'],
            ['tang', 'Ngộ Không, vi sư có thể dùng chân kinh khóa nó lại. Nhưng như thế Tam Giới sẽ bị ràng buộc mãi mãi.'],
            ['wukong', 'Sư phụ, năm trăm năm dưới núi là đủ ràng buộc rồi. Lần này để chúng sinh tự chọn.'],
            ['narrator', 'Ngộ Không giáng gậy xuống. Pháp trận vỡ tan, ánh sáng tràn khắp Tam Giới. Ở đâu đó, một cái đầu bay thở phào vì cuối cùng cũng được nghỉ phép.'],
            ['bajie', 'Vậy là hết kiếp nạn rồi hả Hầu ca? Đi ăn được chưa?'],
            ['wukong', 'Được. Lần này lão Tôn mời. Ngưu đại ca trả tiền.']
        ],
        clear: [
            ['title', 'TÂY DU KÝ', 'THIÊN MỆNH PHÁ TOÁI · HẾT (THẬT ĐẤY)']
        ]
    }
];

const storyOverlay = document.getElementById('story-overlay');
const storyBox = document.getElementById('story-box');
const storyTitle = document.getElementById('story-title');
const storyFace = document.getElementById('story-face');
const storyIcon = document.getElementById('story-icon');
const storyName = document.getElementById('story-name');
const storyText = document.getElementById('story-text');
const storyOptions = document.getElementById('story-options');
const story = { lines: [], i: 0, typed: 0, timer: null, full: false, resume: 'PLAYING', onDone: null, answered: false };
let storyDelay = null; // { part, t }: a beat waiting a moment (lets the boss death play out)

const lineText = line => line.quiz ? line.q : line[1];

function playStory(lines, onDone, full = false) {
    releaseKeys();
    // A copy: quiz replies get spliced in after the question
    Object.assign(story, { lines: [...lines], i: 0, full, resume: gameState, onDone });
    gameState = 'STORY';
    // In a stage the box sits at the top so the boss on the ground stays visible
    storyOverlay.classList.toggle('justify-end', full);
    storyOverlay.classList.toggle('justify-start', !full);
    storyOverlay.classList.remove('hidden');
    setUiFor(gameState);
    showStoryLine();
}

// Plays one part of a stage's story the first time it comes up; otherwise goes straight on
function storyBeat(stage, part, onDone = () => {}) {
    const lines = STORY[stage] && STORY[stage][part];
    const key = `${stage}-${part}`;
    if (!lines || save.storySeen[key]) {
        onDone();
        return;
    }
    save.storySeen[key] = true;
    writeSave();
    playStory(lines, onDone);
}

function showStoryLine() {
    const line = story.lines[story.i];
    const who = line.quiz || line[0];
    const text = lineText(line);
    clearInterval(story.timer);
    story.answered = false;
    storyOptions.classList.add('hidden');
    const isTitle = who === 'title';
    storyTitle.classList.toggle('hidden', !isTitle);
    storyBox.classList.toggle('hidden', isTitle);
    storyOverlay.style.background = isTitle || story.full
        ? `rgba(2, 6, 23, ${isTitle ? 0.92 : 0.8})`
        : 'linear-gradient(to bottom, rgba(2, 6, 23, 0.8), rgba(2, 6, 23, 0) 50%)';
    if (isTitle) {
        document.getElementById('story-title-main').innerText = text;
        document.getElementById('story-title-sub').innerText = line[2] || '';
        story.typed = text.length;
        return;
    }
    const sp = SPEAKERS[who];
    storyName.innerText = sp.name;
    storyName.style.color = sp.color || '';
    storyText.classList.toggle('italic', who === 'narrator');
    storyText.classList.toggle('text-slate-300', who === 'narrator');
    storyFace.classList.toggle('hidden', !sp.char && !sp.face);
    storyIcon.classList.toggle('hidden', !sp.icon);
    if (sp.char) drawCharacterFace(storyFace, sp.char);
    if (sp.face) {
        // Portrait cut from a boss sheet
        const g = storyFace.getContext('2d'), f = sp.face;
        g.clearRect(0, 0, storyFace.width, storyFace.height);
        g.imageSmoothingEnabled = true; // painted art, not pixel art
        g.drawImage(IMG[f.img], f.sx, f.sy, f.sw, f.sh, 0, 0, storyFace.width, storyFace.height);
    }
    if (sp.icon) {
        storyIcon.innerHTML = `<i class="fa-solid ${sp.icon}"></i>`;
        storyIcon.style.color = sp.color;
        storyIcon.style.borderColor = sp.color;
    }
    // Typewriter reveal; a quiz shows its answers once the question is fully typed
    story.typed = 0;
    storyText.innerText = '';
    story.timer = setInterval(() => {
        story.typed++;
        storyText.innerText = text.slice(0, story.typed);
        if (story.typed >= text.length) finishTyping();
    }, 22);
}

function finishTyping() {
    const line = story.lines[story.i];
    clearInterval(story.timer);
    story.typed = lineText(line).length;
    storyText.innerText = lineText(line);
    if (!line.quiz) return;
    storyOptions.innerHTML = line.options.map((o, k) =>
        `<button data-answer="${k}" class="text-left px-3 py-2 rounded-lg bg-slate-800/90 hover:bg-amber-700 border border-amber-500/40 text-slate-100 story-font text-sm cursor-pointer"><b class="text-amber-400">${k + 1}.</b> ${o}</button>`).join('');
    storyOptions.classList.remove('hidden');
}

function answerQuiz(k) {
    const line = story.lines[story.i];
    if (!line.quiz || story.answered || story.typed < line.q.length || !line.options[k]) return;
    story.answered = true;
    const right = k === line.answer;
    let reply = right ? line.right : line.wrong;
    if (right) {
        save.peaches += QUIZ_REWARD;
        writeSave();
        updateHUD();
        reply += ` (+${QUIZ_REWARD} Đào Tiên)`;
    }
    playSound(right ? 'checkpoint' : 'hit');
    story.lines.splice(story.i + 1, 0, [line.quiz, reply]);
    story.i++;
    showStoryLine();
}

function advanceStory() {
    const line = story.lines[story.i];
    if (story.typed < lineText(line).length) {
        // First press finishes the line being typed
        finishTyping();
        return;
    }
    if (line.quiz) return; // waits for an answer
    story.i++;
    if (story.i < story.lines.length) showStoryLine();
    else endStory();
}

function endStory() {
    clearInterval(story.timer);
    storyOverlay.classList.add('hidden');
    releaseKeys();
    gameState = story.resume;
    setUiFor(gameState);
    const done = story.onDone;
    story.onDone = null;
    if (done) done();
}

storyOverlay.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-answer]');
    if (btn) answerQuiz(+btn.dataset.answer);
    else advanceStory();
});

function startRun(levelIndex) {
    initAudio();
    startMusic();
    hideOverlays();
    releaseKeys();
    applyUpgrades();
    gameState = 'PLAYING';
    lives = maxLives;
    score = 0;
    comboCount = 0;
    runPeaches = 0;
    player.mp = 0;
    loadLevel(levelIndex);
    drawAvatar();
    setUiFor(gameState);
    // Stage title shows once the intro (if any) is over
    levelBanner.timer = 0;
    storyBeat(levelIndex, 'intro', () => { levelBanner.timer = BANNER_TIME; });
}

function setPaused(paused) {
    releaseKeys();
    gameState = paused ? 'PAUSED' : 'PLAYING';
    pauseOverlay.classList.toggle('hidden', !paused);
    setUiFor(gameState);
}

// Reached the portal: grade the run, unlock the next stage and any skill this stage teaches
function stageClear() {
    const i = currentLevelIndex;
    const stars = 1 + (lives === maxLives ? 1 : 0) + (chests.every(c => c.opened) ? 1 : 0);
    save.stars[i] = Math.max(save.stars[i] || 0, stars);
    save.bestScores[i] = Math.max(save.bestScores[i] || 0, score);
    // Skill slots that this clear opens for the first time
    const learned = [];
    SLOT_UNLOCK_STAGE.forEach((stage, slot) => {
        if (stage === i && save.unlocked <= stage) learned.push(slot);
    });
    save.unlocked = Math.max(save.unlocked, Math.min(i + 1, LEVELS.length - 1));
    writeSave();

    const isFinal = i === LEVELS.length - 1;
    clearOverlay.querySelector('h2').innerText = isFinal ? 'ĐẠI THẮNG!' : 'QUA ẢI!';
    document.getElementById('clear-stars').innerHTML =
        `<span class="text-amber-400">${'★'.repeat(stars)}</span><span class="text-slate-600">${'★'.repeat(3 - stars)}</span>`;
    document.getElementById('clear-score').innerText = score;
    document.getElementById('clear-peaches').innerText = runPeaches;
    const unlockBox = document.getElementById('clear-unlock');
    unlockBox.classList.toggle('hidden', learned.length === 0);
    unlockBox.innerHTML = learned.map(slot => {
        const s = SKILLS[player.skills[slot]];
        return `Mở ô thần thông <b class="pixel-font text-[10px] text-sky-300">${SLOT_KEYS[slot]}</b> cho mọi nhân vật · `
            + `${player.char.name}: <b class="text-sky-300">${s.name}</b> (${s.cost} Pháp Lực)`;
    }).join('<br>');
    document.getElementById('next-stage-btn').classList.toggle('hidden', isFinal);

    playSound('checkpoint');
    releaseKeys();
    gameState = 'CLEAR';
    clearOverlay.classList.remove('hidden');
    setUiFor(gameState);
}

// Called when the death animation finishes: respawn at the last checkpoint while lives remain
function onPlayerDeath() {
    lives--;
    if (lives <= 0) {
        updateHUD();
        triggerGameOver();
        return;
    }
    player.reset(respawnPoint.x, respawnPoint.y);
    player.invulnerableTimer = 1.5;
    camera.snapTo(player, currentLevel.worldWidth);
    clones = [];
    projectiles = [];
    for (const e of enemies) if (e.type === 'boss') e.fireRain = 0;
    floatingTexts.push(new FloatingText(`CÒN ${lives} MẠNG`, player.x - 30, player.y - 20, '#fca5a5', 12));
    updateHUD();
}

function triggerGameOver() {
    gameState = 'GAMEOVER';
    writeSave();
    document.getElementById('final-score').innerText = score;
    document.getElementById('final-stage').innerText = `Cảnh ${currentLevelIndex + 1}`;
    gameOverOverlay.classList.remove('hidden');
    setUiFor(gameState);
}

function updateHUD() {
    const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
    hpBar.style.width = `${hpPercent}%`;
    hpText.innerText = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    mpBar.style.width = `${(player.mp / player.maxMp) * 100}%`;
    livesDisplay.innerHTML = '<i class="fa-solid fa-heart"></i> '.repeat(Math.max(0, lives));
    peachDisplay.innerText = save.peaches;

    scoreDisplay.innerText = String(score).padStart(5, '0');
    comboDisplay.innerText = `${comboCount}x`;

    if (comboCount > 1) {
        comboDisplay.classList.add('scale-125');
        setTimeout(() => comboDisplay.classList.remove('scale-125'), 100);
    }
}

// Skill slots in the bottom-left corner: locked, not enough mana, or ready
function drawSkillSlots(ctx) {
    let x = 14;
    const y = GAME_HEIGHT - 58;
    ctx.save();
    ctx.textAlign = 'center';
    for (let slot = 0; slot < SLOT_KEYS.length; slot++) {
        const s = SKILLS[player.skills[slot]];
        const learned = isSkillLearned(slot);
        const ready = learned && player.mp >= s.cost;
        ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
        ctx.fillRect(x, y, 48, 44);
        ctx.strokeStyle = ready ? '#38bdf8' : '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, 46, 42);
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.fillStyle = !learned ? '#475569' : ready ? '#e0f2fe' : '#64748b';
        ctx.fillText(learned ? SLOT_KEYS[slot] : '?', x + 24, y + 17);
        ctx.font = "6px 'Press Start 2P', monospace";
        ctx.fillText(learned ? s.short : 'KHÓA', x + 24, y + 29);
        ctx.fillStyle = ready ? '#7dd3fc' : '#475569';
        ctx.fillText(learned ? String(s.cost) : '', x + 24, y + 39);
        x += 54;
    }
    ctx.restore();
}
