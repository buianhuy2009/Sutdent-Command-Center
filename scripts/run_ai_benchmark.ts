/**
 * CLI Runner: AI Training & Model Benchmark Generator
 * Usage: npx tsx scripts/run_ai_benchmark.ts
 */

import { runOfflineAiBenchmark } from '../src/services/aiTrainingPipeline';
import fs from 'fs';
import path from 'path';

console.log('===============================================================');
console.log('  STUDENT COMMAND CENTER (STUDENTOS) - AI BENCHMARK & EVALUATION');
console.log('  Cuộc thi Sáng tạo trẻ Quốc gia trong lĩnh vực AI năm 2026');
console.log('===============================================================\n');

console.log('1. Đang nạp các tập dữ liệu huấn luyện (Training & Evaluation Datasets)...');
console.log('2. Đang thực thi In-Context Few-Shot Calibration...');
console.log('3. Đang đánh giá chỉ số Accuracy, Precision, Recall, F1 Score...\n');

const report = runOfflineAiBenchmark();

console.log('--- KẾT QUẢ ĐÁNH GIÁ MÔ HÌNH (AI EVALUATION REPORT) ---');
console.log(`Mô hình thử nghiệm : ${report.modelName}`);
console.log(`Phiên bản dữ liệu   : ${report.datasetVersion}`);
console.log(`Điểm tổng quát      : ${report.overallScore} / 100 điểm`);
console.log('\n[Tác vụ 1: Phân loại Email Học đường vs Spam]');
console.log(`- Độ chính xác (Accuracy)  : ${report.tasks.emailClassification.accuracy}%`);
console.log(`- Precision                : ${report.tasks.emailClassification.precision}%`);
console.log(`- Recall                   : ${report.tasks.emailClassification.recall}%`);
console.log(`- F1-Score                 : ${report.tasks.emailClassification.f1Score}%`);
console.log(`- Độ trễ trung bình        : ${report.tasks.emailClassification.avgLatencyMs} ms`);

console.log('\n[Tác vụ 2: Bóc tách bài tập bằng Tiếng Việt (NLP Parser)]');
console.log(`- Độ chính xác (Accuracy)  : ${report.tasks.vietnameseNlpExtraction.accuracy}%`);
console.log(`- F1-Score                 : ${report.tasks.vietnameseNlpExtraction.f1Score}%`);

console.log('\n---------------------------------------------------------------');
console.log(`TỔNG KẾT: ${report.summary}`);
console.log('---------------------------------------------------------------\n');

const outputPath = path.join(process.cwd(), 'ai_evaluation_report.json');
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(`✓ Đã xuất tệp báo cáo kỹ thuật: ${outputPath}`);
console.log('✓ Bạn có thể in tệp JSON này hoặc đính kèm vào thư mục Google Drive nộp cho BTC!\n');
