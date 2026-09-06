/**
 * AI Training & Evaluation Datasets for Student Command Center (StudentOS)
 * Used for Few-Shot In-Context Training, Prompt Calibration, and Benchmark Evaluation
 */

export interface EmailTrainingSample {
  id: string;
  sender: string;
  subject: string;
  bodySnippet: string;
  groundTruth: {
    category: 'ASSIGNMENT' | 'EXAM' | 'GRADE' | 'SCHEDULE' | 'ANNOUNCEMENT' | 'SPAM' | 'PROMOTION';
    isSpam: boolean;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    detectedAssignment?: {
      isAssignment: boolean;
      name: string;
      subject: string;
      priority: 'High' | 'Med' | 'Low';
    };
  };
}

export interface NlpTaskTrainingSample {
  id: string;
  rawInput: string;
  groundTruth: {
    subject: string;
    assignmentName: string;
    priority: 'High' | 'Med' | 'Low';
    relativeDueDays: number; // 0 for today, 1 for tomorrow, 7 for next week, etc.
  };
}

export interface MathFormulaSample {
  id: string;
  topic: string;
  rawMathDescription: string;
  groundTruthLatex: string;
  stepCount: number;
}

/**
 * Dataset 1: Phân loại Email Học đường & Lọc Thư rác (Academic vs Spam Email Dataset)
 */
export const ACADEMIC_EMAIL_DATASET: EmailTrainingSample[] = [
  {
    id: 'em-001',
    sender: 'thaynguyen.toan@thpt.edu.vn',
    subject: 'Thông báo nộp bài tập Giải tích chương 3',
    bodySnippet: 'Các em học sinh lớp 12A1 nộp bài tập Giải tích chương 3 vào trước 23h59 ngày 15/09/2026 trên Canvas.',
    groundTruth: {
      category: 'ASSIGNMENT',
      isSpam: false,
      urgency: 'HIGH',
      detectedAssignment: { isAssignment: true, name: 'Bài tập Giải tích chương 3', subject: 'Toán học', priority: 'High' }
    }
  },
  {
    id: 'em-002',
    sender: 'phongdaotao@university.edu.vn',
    subject: 'Lịch thi kết thúc học phần Học kỳ 1 năm học 2026-2027',
    bodySnippet: 'Phòng Đào tạo xin thông báo lịch thi học kỳ 1 cho toàn thể sinh viên. Đề nghị các bạn có mặt trước 15 phút.',
    groundTruth: {
      category: 'EXAM',
      isSpam: false,
      urgency: 'HIGH'
    }
  },
  {
    id: 'em-003',
    sender: 'deals@shopee.vn',
    subject: 'Siêu hội sale 9.9 - Giảm giá tới 50% toàn sàn',
    bodySnippet: 'Hàng triệu voucher giảm giá 50k, miễn phí vận chuyển đang chờ bạn. Bấm mua ngay hôm nay!',
    groundTruth: {
      category: 'PROMOTION',
      isSpam: true,
      urgency: 'INFO'
    }
  },
  {
    id: 'em-004',
    sender: 'noreply@spotify.com',
    subject: 'Your Weekly Music Mix is ready',
    bodySnippet: 'Discover new tracks based on your recent listening habits on Spotify Premium.',
    groundTruth: {
      category: 'SPAM',
      isSpam: true,
      urgency: 'INFO'
    }
  },
  {
    id: 'em-005',
    sender: 'colan.tienganh@school.edu.vn',
    subject: 'Assignment: Unit 4 Essay Draft Due Friday',
    bodySnippet: 'Please submit your first draft of Unit 4 argumentative essay on Canvas before Friday 5 PM.',
    groundTruth: {
      category: 'ASSIGNMENT',
      isSpam: false,
      urgency: 'HIGH',
      detectedAssignment: { isAssignment: true, name: 'Unit 4 Essay Draft', subject: 'Tiếng Anh', priority: 'High' }
    }
  },
  {
    id: 'em-006',
    sender: 'bancansu.lop11b@gmail.com',
    subject: 'Họp ban cán sự lớp triển khai kế hoạch 20/11',
    bodySnippet: 'Thân mời các bạn trong ban cán sự họp tại phòng 204 vào tiết sinh hoạt cuối tuần này.',
    groundTruth: {
      category: 'ANNOUNCEMENT',
      isSpam: false,
      urgency: 'MEDIUM'
    }
  },
  {
    id: 'em-007',
    sender: 'thayminh.vatly@thpt.edu.vn',
    subject: 'Điểm kiểm tra 1 tiết môn Vật Lý lớp 11A',
    bodySnippet: 'Thầy gửi bảng điểm kiểm tra 1 tiết chương Quang hình học, các bạn xem lại nếu có thắc mắc báo thầy.',
    groundTruth: {
      category: 'GRADE',
      isSpam: false,
      urgency: 'MEDIUM'
    }
  },
  {
    id: 'em-008',
    sender: 'marketing@fashionhub.com',
    subject: 'Ưu đãi bộ sưu tập Thu Đông dành cho giới trẻ',
    bodySnippet: 'Giảm giá 30% cho học sinh sinh viên khi xuất trình thẻ.',
    groundTruth: {
      category: 'PROMOTION',
      isSpam: true,
      urgency: 'INFO'
    }
  }
];

/**
 * Dataset 2: Ngữ liệu Nhận diện Thực thể Bài tập Tự nhiên tiếng Việt (Vietnamese NLP Task Dataset)
 */
export const VIETNAMESE_NLP_TASK_DATASET: NlpTaskTrainingSample[] = [
  {
    id: 'nlp-001',
    rawInput: 'Làm đề cương ôn tập môn Hóa trước 8h tối mai ưu tiên cao',
    groundTruth: {
      subject: 'Hóa học',
      assignmentName: 'Đề cương ôn tập môn Hóa',
      priority: 'High',
      relativeDueDays: 1
    }
  },
  {
    id: 'nlp-002',
    rawInput: 'Nộp bài báo cáo thực hành Vật Lý chương 2 thứ 6 tuần sau',
    groundTruth: {
      subject: 'Vật lý',
      assignmentName: 'Báo cáo thực hành Vật Lý chương 2',
      priority: 'Med',
      relativeDueDays: 5
    }
  },
  {
    id: 'nlp-003',
    rawInput: 'Đọc 3 chương sách Lịch sử văn minh thế giới chủ nhật tuần này',
    groundTruth: {
      subject: 'Lịch sử',
      assignmentName: 'Đọc 3 chương sách Lịch sử văn minh thế giới',
      priority: 'Low',
      relativeDueDays: 7
    }
  },
  {
    id: 'nlp-004',
    rawInput: 'Viết bài luận tiếng Anh về biến đổi khí hậu 500 từ hạn chót hôm nay gấp',
    groundTruth: {
      subject: 'Tiếng Anh',
      assignmentName: 'Bài luận tiếng Anh về biến đổi khí hậu 500 từ',
      priority: 'High',
      relativeDueDays: 0
    }
  },
  {
    id: 'nlp-005',
    rawInput: 'Giải 10 bài tập xác suất thống kê đại học tuần tới',
    groundTruth: {
      subject: 'Toán học',
      assignmentName: 'Giải 10 bài tập xác suất thống kê',
      priority: 'Med',
      relativeDueDays: 7
    }
  }
];

/**
 * Dataset 3: Dữ liệu Công thức Toán học & LaTeX OCR (Math LaTeX Dataset)
 */
export const MATH_LATEX_DATASET: MathFormulaSample[] = [
  {
    id: 'math-001',
    topic: 'Tích phân từng phần',
    rawMathDescription: 'Tích phân từ 0 đến pi của x nhân sin x dx',
    groundTruthLatex: '\\int_{0}^{\\pi} x \\sin(x) \\, dx = \\pi',
    stepCount: 3
  },
  {
    id: 'math-002',
    topic: 'Công thức nghiệm bậc hai',
    rawMathDescription: 'Nghiệm phương trình bậc hai ax bình cộng bx cộng c bằng 0',
    groundTruthLatex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    stepCount: 2
  },
  {
    id: 'math-003',
    topic: 'Đạo hàm hàm số lượng giác',
    rawMathDescription: 'Đạo hàm của hàm số f(x) = ln(cos(x))',
    groundTruthLatex: 'f\'(x) = -\\tan(x)',
    stepCount: 2
  }
];
