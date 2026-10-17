import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';
import { Label } from '@/lib/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadImageToCloudinary } from '@/src/lib/cloudinary';
import { toast } from 'sonner';
import { Question } from '@/src/types';

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  handleUpdateQuestion: (updatedQuestionData: {
    id: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
    topic: string;
    imageUrl?: string;
  }) => Promise<void>;
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  isOpen,
  onClose,
  question,
  handleUpdateQuestion,
}) => {
  const [formData, setFormData] = useState({
    id: '',
    text: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    topic: 'General',
    imageUrl: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (question) {
      setFormData({
        id: question.id,
        text: question.text || '',
        options: question.options && question.options.length === 4 ? [...question.options] : [question.options?.[0] || '', question.options?.[1] || '', question.options?.[2] || '', question.options?.[3] || ''],
        correctOptionIndex: question.correctOptionIndex ?? 0,
        topic: question.topic || 'General',
        imageUrl: question.imageUrl || '',
      });
    }
  }, [question]);

  if (!isOpen || !question) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setFormData(prev => ({ ...prev, imageUrl }));
      toast.success('Question image uploaded successfully');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Failed to upload question image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      toast.error('Question text cannot be empty');
      return;
    }
    if (formData.options.some(opt => !opt.trim())) {
      toast.error('All 4 options must be filled');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleUpdateQuestion(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6 text-base overflow-hidden">
      <div className="cbt-background" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-5 sm:p-6 border border-primary/5 overflow-hidden relative z-10 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-lg font-black text-primary mb-4 text-center tracking-tighter uppercase">Edit Question Item</h3>
        <form onSubmit={onSubmit} className="space-y-4 font-medium">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Question Text</Label>
            <textarea
              value={formData.text}
              onChange={e => setFormData({ ...formData, text: e.target.value })}
              placeholder="Enter question statement..."
              required
              className="w-full h-24 px-6 py-4 rounded-2xl bg-slate-50 border-2 border-primary/20 font-bold text-xs shadow-inner outline-none focus:border-primary focus:ring-0 resize-none transition-all"
            />
          </div>

          {/* Question Image Section */}
          <div className="space-y-2">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Question Image (Optional)</Label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {formData.imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-primary/10 bg-slate-50 p-4 flex flex-col items-center justify-center group">
                <img
                  src={formData.imageUrl}
                  alt="Question Diagram"
                  className="max-h-40 rounded-lg object-contain shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-black text-[10px] tracking-wider transition-all uppercase"
                >
                  <X className="w-3.5 h-3.5" /> Remove Image
                </button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                className="w-full h-14 rounded-2xl border-2 border-dashed border-primary/20 bg-slate-50 hover:bg-primary/5 font-black text-xs text-primary flex items-center justify-center gap-2 tracking-widest uppercase shadow-none transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Uploading Image...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-primary" />
                    <span>Upload Question Image</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="space-y-1.5">
                <Label className="text-[10px] font-black text-primary/30 tracking-widest">Option {String.fromCharCode(65 + i)}</Label>
                <Input
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={formData.options[i] || ''}
                  onChange={e => {
                    const opts = [...formData.options];
                    opts[i] = e.target.value;
                    setFormData({ ...formData, options: opts });
                  }}
                  required
                  className="h-10 px-5 rounded-xl bg-slate-50 font-bold text-xs shadow-inner"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="w-full space-y-1.5">
              <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Correct Answer</Label>
              <select
                value={formData.correctOptionIndex}
                onChange={e => setFormData({ ...formData, correctOptionIndex: parseInt(e.target.value) })}
                className="w-full h-10 px-5 rounded-xl bg-slate-50 border-2 border-primary/20 font-bold text-xs outline-none shadow-inner focus:border-primary transition-all"
              >
                <option value={0}>Answer: A</option>
                <option value={1}>Answer: B</option>
                <option value={2}>Answer: C</option>
                <option value={3}>Answer: D</option>
              </select>
            </div>
            <div className="w-full space-y-1.5">
              <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Topic Tag</Label>
              <Input
                placeholder="e.g. Algebra"
                value={formData.topic}
                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                className="h-10 px-5 rounded-xl bg-slate-50 font-bold text-xs shadow-inner"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isUploading || isSubmitting}
              className="flex-1 h-14 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all tracking-widest text-xs uppercase"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="h-14 px-8 rounded-2xl font-black text-xs border-primary/10 uppercase"
            >
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
