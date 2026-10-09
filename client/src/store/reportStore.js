import { create } from 'zustand';
import { reportService } from '../services/report.service';
import toast from 'react-hot-toast';

const useReportStore = create((set) => ({
  reports: [],
  isSubmitting: false,

  setReports: (reports) => set({ reports }),

  submitReport: async (data) => {
    set({ isSubmitting: true });
    try {
      const { data: res } = await reportService.create(data);
      toast.success('Report submitted. Thank you for keeping the community safe.');
      set({ isSubmitting: false });
      return res.data;
    } catch (err) {
      set({ isSubmitting: false });
      toast.error(err.response?.data?.message || 'Failed to submit report');
      throw err;
    }
  },

  voteReport: async (id, vote_type) => {
    try {
      const { data: res } = await reportService.vote(id, vote_type);
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to vote');
      throw err;
    }
  },
}));

export default useReportStore;
