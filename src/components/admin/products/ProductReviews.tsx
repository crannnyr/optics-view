interface Review {
  reviewer_name: string;
  rating: number;
  comment: string;
}

interface ProductReviewsProps {
  reviews: Review[];
  newReview: Review;
  setNewReview: (review: Review) => void;
  addReview: () => void;
}

export default function ProductReviews({
  reviews,
  newReview,
  setNewReview,
  addReview
}: ProductReviewsProps) {
  return (
    <div className="border-t pt-6">
      <h3 className="text-sm font-medium mb-3 text-[#0d2818]">Manual Reviews</h3>
      <div className="bg-gray-50 p-4 space-y-3 rounded border border-gray-100">
        <input
          placeholder="Reviewer Name"
          className="w-full border p-2 text-xs focus:border-[#0d2818] outline-none bg-white"
          value={newReview.reviewer_name}
          onChange={e => setNewReview({...newReview, reviewer_name: e.target.value})}
        />
        <textarea
          placeholder="Review Comment"
          className="w-full border p-2 text-xs focus:border-[#0d2818] outline-none bg-white"
          value={newReview.comment}
          onChange={e => setNewReview({...newReview, comment: e.target.value})}
        />
        <button
          type="button"
          onClick={addReview}
          className="w-full text-xs bg-white border border-gray-300 py-2 hover:bg-gray-100 uppercase tracking-wider"
        >
          Add Review
        </button>

        <div className="max-h-32 overflow-y-auto space-y-2 pt-2">
          {reviews.map((r, i) => (
            <div key={i} className="text-[10px] text-gray-500 bg-white p-2 border border-gray-100">
              <span className="font-bold text-gray-700">{r.reviewer_name}</span>: {r.comment.substring(0, 50)}...
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
