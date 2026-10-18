"use client";

import React, { useState } from "react";
import { useWallet, useAddress } from "@meshsdk/react";
import {
  HeartHandshake,
  Send,
  PlusCircle,
  X,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Coins,
  Loader2,
  UploadCloud,
  FileCheck,
  Sparkles,
} from "lucide-react";

interface ExpenseItem {
  id: string;
  name: string;
  ada: number;
}

export function CreateProposalContent() {
  const { connected, wallet } = useWallet();
  const address = useAddress();

  const [title, setTitle] = useState("Cơm trưa 2 tuần ôn thi tốt nghiệp - ĐHBK HCM");
  const [description, setDescription] = useState(
    "Hỗ trợ phiếu cơm trưa căn-tin B1 cho nhóm 5 sinh viên năm cuối hoàn cảnh khó khăn tập trung làm đồ án tốt nghiệp Kỹ sư Điện tử viễn thông."
  );
  const [category, setCategory] = useState<"meals" | "books" | "health" | "emergency">("meals");
  const [requestedAda, setRequestedAda] = useState<number>(30);
  const [items, setItems] = useState<ExpenseItem[]>([
    { id: "1", name: "14 suất cơm trưa tại Canteen B1 (@35k)", ada: 20 },
    { id: "2", name: "Bánh mì & sữa đậu nành ôn bài đêm", ada: 10 },
  ]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAda, setNewItemAda] = useState(5);
  const [showAddItem, setShowAddItem] = useState(false);

  // Proof image upload state
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
  );
  const [ipfsHash, setIpfsHash] = useState("QmX7yZ8W9vK3pM2qR4sT5uV6wY1xA3bC5dE7fG9hI");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      ada: newItemAda,
    };
    const updated = [...items, newItem];
    setItems(updated);
    setRequestedAda(updated.reduce((sum, it) => sum + it.ada, 0));
    setNewItemName("");
    setNewItemAda(5);
    setShowAddItem(false);
  };

  const handleRemoveItem = (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    setRequestedAda(updated.reduce((sum, it) => sum + it.ada, 0));
  };

  const handleSubmitProposal = async () => {
    if (!connected || !wallet) {
      setErrorMessage("Vui lòng kết nối ví Cardano để nộp cọc 2 ADA và tạo đề xuất.");
      return;
    }

    if (!title.trim() || requestedAda <= 0) {
      setErrorMessage("Vui lòng nhập đầy đủ tiêu đề và số ADA cần hỗ trợ.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Simulate building Plutus V3 campaign creation transaction with 2 ADA collateral
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const fakeHash = "4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b";
      setTxHash(fakeHash);
    } catch (err: unknown) {
      console.error("Create proposal error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Giao dịch tạo đề xuất thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col gap-5 pt-4 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canteen-amber/20 text-on-primary-container w-fit">
          <HeartHandshake className="w-3.5 h-3.5 text-deep-navy" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-deep-navy">
            Cardano Micro-Grant Dispatch
          </span>
        </div>
        <h1 className="font-extrabold text-2xl tracking-tight text-deep-navy mt-1">
          Tạo Đơn Đề Xuất "Feed Me"
        </h1>
        <p className="text-xs text-stone-500 leading-relaxed">
          Xin hỗ trợ bữa ăn hoặc tài liệu học tập từ quỹ cộng đồng. Quản trị bởi hợp đồng thông minh
          Plutus V3 và cơ chế bỏ phiếu Quadratic Voting.
        </p>
      </div>

      {/* Success View */}
      {txHash ? (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-fresh-mint/20 text-fresh-mint flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-extrabold text-deep-navy">Đăng Đơn Đề Xuất Thành Công!</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Đề xuất <strong>"{title}"</strong> đã được ghi nhận trên Cardano Preview Testnet với{" "}
            <strong>2 ADA</strong> cọc chống spam. Cộng đồng có thể bắt đầu bỏ phiếu bằng token $FEED
            ngay bây giờ.
          </p>
          <div className="p-3 bg-stone-50 rounded-2xl w-full text-left text-[11px] font-mono break-all text-stone-500">
            TxHash: {txHash}
          </div>
          <a
            href={`https://preview.cardanoscan.io/transaction/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-warm-terracotta hover:underline"
          >
            <span>Xem trên CardanoScan Preview</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => {
              setTxHash(null);
              setTitle("");
              setDescription("");
            }}
            className="w-full mt-2 py-3 rounded-full bg-canteen-amber text-deep-navy font-extrabold text-xs shadow-md"
          >
            Tạo đề xuất mới
          </button>
        </section>
      ) : (
        /* Form View */
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 flex flex-col gap-4">
          {/* Field: Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-deep-navy flex justify-between">
              <span>Bạn cần hỗ trợ điều gì?</span>
              <span className="text-[10px] text-stone-400 font-normal">Tối đa 70 ký tự</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Cơm trưa 2 tuần ôn thi tốt nghiệp..."
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs text-deep-navy font-semibold focus:outline-none focus:border-canteen-amber focus:bg-white transition-all"
            />
          </div>

          {/* Field: Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-deep-navy">Danh mục đề xuất</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory("meals")}
                className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all text-left ${
                  category === "meals"
                    ? "bg-canteen-amber/20 border-canteen-amber text-deep-navy shadow-xs"
                    : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                <span className="text-base">🍜</span>
                <span className="truncate">Cơm Căn-tin</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("books")}
                className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all text-left ${
                  category === "books"
                    ? "bg-canteen-amber/20 border-canteen-amber text-deep-navy shadow-xs"
                    : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                <span className="text-base">📚</span>
                <span className="truncate">Sách & Giáo Trình</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("health")}
                className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all text-left ${
                  category === "health"
                    ? "bg-canteen-amber/20 border-canteen-amber text-deep-navy shadow-xs"
                    : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                <span className="text-base">🏥</span>
                <span className="truncate">Y Tế Học Đường</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("emergency")}
                className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all text-left ${
                  category === "emergency"
                    ? "bg-red-50 border-red-300 text-red-700 shadow-xs"
                    : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                <span className="text-base">⚡</span>
                <span className="truncate">Cấp Bách</span>
              </button>
            </div>
          </div>

          {/* Field: Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-deep-navy">Hoàn cảnh và lý do cần hỗ trợ</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chia sẻ ngắn gọn hoàn cảnh sinh viên, nhu cầu thực tế..."
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-deep-navy focus:outline-none focus:border-canteen-amber focus:bg-white transition-all leading-relaxed"
            />
          </div>

          {/* Field: Requested ADA */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-deep-navy">Số ADA cần hỗ trợ</label>
              <span className="text-[10px] text-emerald-800 font-extrabold bg-fresh-mint/20 px-2 py-0.5 rounded-full">
                Mức trần: 150 ADA
              </span>
            </div>

            <div className="flex items-center bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 gap-2 focus-within:border-canteen-amber focus-within:bg-white transition-all">
              <span className="text-lg font-bold text-deep-navy">₳</span>
              <input
                type="number"
                min="5"
                max="150"
                value={requestedAda}
                onChange={(e) => setRequestedAda(Number(e.target.value))}
                className="w-full bg-transparent font-extrabold text-base text-deep-navy outline-none"
              />
              <span className="text-xs font-semibold text-stone-400">ADA</span>
            </div>

            {/* Telemetry card */}
            <div className="p-3 bg-surface-container-high/50 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="font-bold text-deep-navy">≈ {(requestedAda * 25000).toLocaleString()} VND</span>
                <span className="text-[10px] text-stone-500">
                  Tương đương ~{Math.floor((requestedAda * 25000) / 35000)} suất cơm nóng
                </span>
              </div>
              <span className="text-[10px] bg-white px-2 py-1 rounded-full font-bold text-stone-600 shadow-xs">
                Micro-grant Tier 1
              </span>
            </div>
          </div>

          {/* Field: Expense Breakdown */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-deep-navy">Chi tiết các khoản chi tiêu</label>
              <button
                type="button"
                onClick={() => setShowAddItem(!showAddItem)}
                className="text-[11px] font-bold text-warm-terracotta hover:underline flex items-center gap-0.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Thêm mục</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl text-xs border border-stone-200/60"
                >
                  <span className="text-stone-700 truncate font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-deep-navy whitespace-nowrap bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                      ₳ {item.ada}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-stone-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {showAddItem && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 flex flex-col gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Tên mục chi (VD: Giáo trình, Cơm trưa...)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={newItemAda}
                      onChange={(e) => setNewItemAda(Number(e.target.value))}
                      className="w-20 bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs outline-none"
                    />
                    <span className="text-xs text-stone-500">ADA</span>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="ml-auto px-3 py-1.5 rounded-xl bg-canteen-amber text-deep-navy font-bold text-xs"
                    >
                      Lưu mục
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Field: IPFS Proof & Bill Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-deep-navy">Minh chứng / Ảnh đính kèm (IPFS)</label>
            <div className="p-3 bg-stone-50 border border-dashed border-stone-300 rounded-2xl flex flex-col items-center gap-2 text-center">
              <div className="w-9 h-9 rounded-full bg-canteen-amber/20 flex items-center justify-center text-deep-navy">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-deep-navy">Ảnh thẻ sinh viên / Hóa đơn canteen</p>
                <p className="text-[10px] text-stone-400">Được mã hóa và lưu trữ phân tán trên IPFS</p>
              </div>

              {/* Uploaded File preview */}
              <div className="w-full bg-white p-2 rounded-xl border border-stone-200 flex items-center justify-between text-left text-xs mt-1 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck className="w-4 h-4 text-fresh-mint shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-deep-navy truncate block">the_sinh_vien_dhbk.jpg</span>
                    <span className="text-[10px] text-stone-400 font-mono">IPFS: {ipfsHash.slice(0, 16)}...</span>
                  </div>
                </div>
                <span className="text-[10px] bg-fresh-mint/15 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                  Đã xác thực
                </span>
              </div>
            </div>
          </div>

          {/* Crucial 2 ADA Anti-Spam Collateral Notice Banner */}
          <div className="bg-secondary-fixed text-on-secondary-fixed p-3.5 rounded-2xl flex items-start gap-3 border border-red-200">
            <ShieldAlert className="w-5 h-5 text-warm-terracotta shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="font-extrabold text-on-secondary-fixed">
                Tiền Cọc Chống Spam (Anti-Spam Collateral)
              </span>
              <p className="text-[11px] text-on-secondary-fixed-variant leading-relaxed">
                Yêu cầu nộp <strong>2 ADA</strong> cọc vào smart contract <code>campaign.ak</code>. Bạn
                sẽ được <strong>hoàn trả 100%</strong> 2 ADA này khi đề xuất kết thúc thời gian biểu quyết!
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitProposal}
            disabled={isSubmitting}
            className="w-full h-12 rounded-full bg-canteen-amber text-deep-navy font-extrabold text-xs shadow-md hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-deep-navy" />
                <span>Đang nộp cọc 2 ADA & khởi tạo đề xuất...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-deep-navy" />
                <span>Nộp cọc 2 ADA & Gửi Đề Xuất Đến Cộng Đồng</span>
              </>
            )}
          </button>
        </section>
      )}
    </main>
  );
}
