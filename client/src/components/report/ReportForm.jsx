import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CATEGORIES, SEVERITY_LABELS } from '../../utils/categories';
import useReportStore from '../../store/reportStore';

export default function ReportForm({ isOpen, onClose, location, onSubmit }) {
  const [form, setForm] = useState({
    category: 'poorly_lit',
    severity: 3,
    description: '',
    hour_of_day: new Date().getHours(),
  });
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const isSubmitting = useReportStore((s) => s.isSubmitting);
  const submitReport = useReportStore((s) => s.submitReport);

  const validate = () => {
    const errs = {};
    if (!location) errs.location = 'Click on the map to set location';
    if (!form.category) errs.category = 'Category required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const data = {
        lat: location.lat,
        lng: location.lng,
        category: form.category,
        severity: form.severity,
        description: form.description,
        hour_of_day: form.hour_of_day,
      };
      if (photo) data.photo = photo;

      const report = await submitReport(data);
      onSubmit?.(report);
      onClose();
      setForm({ category: 'poorly_lit', severity: 3, description: '', hour_of_day: new Date().getHours() });
      setPhoto(null);
    } catch {
      // handled in store
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Unsafe Location" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Location</label>
          {location ? (
            <p className="text-sm text-safe">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Click anywhere on the map to set location</p>
          )}
          {errors.location && <p className="text-danger text-xs mt-1">{errors.location}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Severity: {SEVERITY_LABELS[form.severity]} ({form.severity})
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: parseInt(e.target.value, 10) })}
            className="w-full accent-accent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Describe what happened..."
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Hour of incident</label>
          <input
            type="number"
            min={0}
            max={23}
            value={form.hour_of_day}
            onChange={(e) => setForm({ ...form, hour_of_day: parseInt(e.target.value, 10) })}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
            className="text-sm text-gray-400"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>Submit Report</Button>
        </div>
      </form>
    </Modal>
  );
}
