export interface Proposal {
  id: string;
  campaignIdHex: string;
  creator: {
    name: string;
    avatar: string;
    campus: string;
    verified: boolean;
    keyHash: string;
  };
  title: string;
  description: string;
  category: "meal" | "books" | "urgent";
  image: string;
  requestedAda: number;
  estimatedMeals: number;
  depositCollateral: number;
  deadlineHours: number;
  deadlinePosixTime: number;
  yesVotesSqrt: number;
  totalVotesSqrt: number;
  voterCount: number;
  status: "Active" | "Approved" | "Disbursed" | "Rejected";
}

export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "prop-1",
    campaignIdHex: "63616d706169676e31",
    creator: {
      name: "Minh Quân",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
      campus: "Verified ĐHBK HCM • K20",
      verified: true,
      keyHash: "5867c3b8e27840f556ac268b781578b14c5661fc63ee720dbeab663f",
    },
    title: "Cơm trưa 2 tuần ôn thi tốt nghiệp - ĐHBK",
    description:
      "Hỗ trợ phiếu cơm trưa căn-tin B1 cho nhóm 5 sinh viên năm cuối hoàn cảnh khó khăn tập trung làm đồ án tốt nghiệp Kỹ sư Điện tử viễn thông.",
    category: "meal",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    requestedAda: 35,
    estimatedMeals: 70,
    depositCollateral: 2,
    deadlineHours: 18,
    deadlinePosixTime: Date.now() + 18 * 3600 * 1000,
    yesVotesSqrt: 36,
    totalVotesSqrt: 44,
    voterCount: 32,
    status: "Active",
  },
  {
    id: "prop-2",
    campaignIdHex: "63616d706169676e32",
    creator: {
      name: "Thùy Trang",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      campus: "Verified ĐH KHTN • K22",
      verified: true,
      keyHash: "4640a7b0a55abb707797634a144b070fdb74d89669c73271b6743a4e",
    },
    title: "Bộ sách giáo trình Giải tích & Đại số tuyến tính",
    description:
      "Quyên góp kinh phí mua giáo trình cương lĩnh đại học và tập bài tập cho 3 bạn sinh viên chuyên ngành Khoa học Dữ liệu mồ côi cha mẹ.",
    category: "books",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    requestedAda: 20,
    estimatedMeals: 40,
    depositCollateral: 2,
    deadlineHours: 42,
    deadlinePosixTime: Date.now() + 42 * 3600 * 1000,
    yesVotesSqrt: 28,
    totalVotesSqrt: 38,
    voterCount: 19,
    status: "Active",
  },
  {
    id: "prop-3",
    campaignIdHex: "63616d706169676e33",
    creator: {
      name: "Đức Hùng",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      campus: "Verified ĐH Sư Phạm Kỹ Thuật",
      verified: true,
      keyHash: "a2c20c77887ace1cd986193e4e75babd1324bc5021b6b203a077e4b9",
    },
    title: "Phiếu ăn sáng 1 tháng cho tân sinh viên hoàn cảnh khó khăn",
    description:
      "Tân sinh viên miền Trung vừa nhập học gia đình bị ảnh hưởng bão lũ, cần hỗ trợ bữa ăn sáng dinh dưỡng tại canteen trường.",
    category: "urgent",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
    requestedAda: 45,
    estimatedMeals: 90,
    depositCollateral: 2,
    deadlineHours: 8,
    deadlinePosixTime: Date.now() + 8 * 3600 * 1000,
    yesVotesSqrt: 52,
    totalVotesSqrt: 56,
    voterCount: 45,
    status: "Approved",
  },
];
