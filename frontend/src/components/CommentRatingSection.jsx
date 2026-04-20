import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, X, User, Calendar } from 'lucide-react';

const CommentRatingSection = ({
  eventId,
  eventName,
  canComment = false,
  showPreview = false,
  formOnly = false,
  onCommentAdded,
  onRatingAdded,
  onSuccess
}) => {
  const [comments, setComments] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCommentsAndRatings();
  }, [eventId]);

  const fetchCommentsAndRatings = async () => {
    if (!eventId) return;
    try {
      const [commentsRes, ratingsRes] = await Promise.all([
        fetch(`http://localhost:8080/api/events/${eventId}/comments`),
        fetch(`http://localhost:8080/api/events/${eventId}/ratings`)
      ]);

      const commentsData = await commentsRes.json();
      const ratingsData = await ratingsRes.json();

      if (commentsData.success) {
        setComments(commentsData.data);
      }

      if (ratingsData.success) {
        setRatings(ratingsData.data);
        if (ratingsData.data.length > 0) {
          const avg = ratingsData.data.reduce((sum, r) => sum + r.rating, 0) / ratingsData.data.length;
          setAverageRating(avg);
        } else {
          setAverageRating(0);
        }
      }
    } catch (error) {
      console.error('Error fetching comments and ratings:', error);
    }
  };

  const handleSubmitExperience = async () => {
    if (newRating === 0) return; // Rating is mandatory

    setIsSubmitting(true);
    try {
      const walletAddr = localStorage.getItem('walletAddress');
      const shortAddr = walletAddr ? walletAddr.slice(-4).toUpperCase() : '????';
      const basePayload = {
        userName: walletAddr ? `User_${shortAddr}` : 'Anonymous User',
        userWallet: walletAddr
      };

      // 1. Submit Rating (mandatory)
      const ratingRes = await fetch(`http://localhost:8080/api/events/${eventId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, rating: newRating })
      });
      const ratingData = await ratingRes.json();

      // 2. Submit Comment (optional)
      let commentData = null;
      if (newComment.trim()) {
        const commentRes = await fetch(`http://localhost:8080/api/events/${eventId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...basePayload, comment: newComment, verified: !!walletAddr })
        });
        commentData = await commentRes.json();
      }

      if (ratingData.success) {
        setNewRating(0);
        setNewComment('');
        setShowSubmissionModal(false);
        fetchCommentsAndRatings(); // Fetch updated lists

        if (onRatingAdded) onRatingAdded({ ...basePayload, rating: newRating });
        if (commentData?.success && onCommentAdded) onCommentAdded({ ...basePayload, comment: newComment });

        // If in formOnly mode, notify parent to close modal
        if (formOnly && onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error submitting experience:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStars = (rating, interactive = false, size = 'w-5 h-5') => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`${size} ${(interactive ? (hoveredStar || newRating) : rating) > index
          ? 'fill-yellow-400 text-yellow-400'
          : 'text-gray-600'
          } ${interactive ? 'cursor-pointer transition-all' : ''}`}
        onClick={interactive ? () => setNewRating(index + 1) : undefined}
        onMouseEnter={interactive ? () => setHoveredStar(index + 1) : undefined}
        onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
      />
    ));
  };

  // Limit comments shown in preview mode
  const displayedComments = showPreview ? comments.slice(0, 3) : comments;

  if (formOnly) {
    return (
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full text-center mx-auto">
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2 font-semibold text-center">How would you rate this event? (Required)</p>
          <div className="flex justify-center space-x-2">
            {renderStars(newRating, true, 'w-8 h-8')}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2 font-semibold text-center">Add a comment (Optional)</p>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share more details about your experience..."
            className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all resize-none text-center"
            rows="4"
          />
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleSubmitExperience}
            disabled={newRating === 0 || isSubmitting}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            <Send className="w-5 h-5" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className={`${showPreview ? 'bg-transparent border-0 p-0' : 'bg-gray-900/50 backdrop-blur-xl rounded-xl border border-purple-500/30 p-6'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${showPreview ? 'text-lg' : 'text-xl'} font-bold text-white flex items-center`}>
            <Star className={`${showPreview ? 'w-5 h-5' : 'w-6 h-6'} text-yellow-400 mr-2`} />
            {showPreview ? 'Rating' : 'Event Rating'}
          </h3>

        </div>

        <div className="flex items-center space-x-4">
          <div className={showPreview ? '' : 'text-center'}>
            <div className={`${showPreview ? 'text-2xl' : 'text-4xl'} font-bold text-yellow-400`}>
              {averageRating.toFixed(1)}
            </div>
            <div className={`flex items-center ${showPreview ? '' : 'justify-center'} mt-1`}>
              {renderStars(averageRating, false, showPreview ? 'w-4 h-4' : 'w-5 h-5')}
            </div>
            <div className={`${showPreview ? 'text-xs' : 'text-sm'} text-gray-400 mt-1`}>
              {ratings.length} {showPreview ? 'ratings' : 'total ratings'}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className={`${showPreview ? 'bg-transparent border-0 p-0' : 'bg-gray-900/50 backdrop-blur-xl rounded-xl border border-purple-500/30 p-6'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${showPreview ? 'text-lg' : 'text-xl'} font-bold text-white flex items-center`}>
            <MessageSquare className={`${showPreview ? 'w-5 h-5' : 'w-6 h-6'} text-purple-400 mr-2`} />
            Comments ({comments.length})
          </h3>
          {canComment && !showPreview && (
            <button
              onClick={() => setShowSubmissionModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 flex items-center space-x-2 text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Rate & Comment</span>
            </button>
          )}
        </div>

        {/* Comments List */}
        <div className={`space-y-3 ${showPreview ? 'max-h-64' : 'max-h-96'} overflow-y-auto`}>
          {displayedComments.length > 0 ? (
            <>
              {displayedComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`${showPreview ? 'p-3' : 'p-4'} bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/20`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`${showPreview ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center`}>
                        <User className={`${showPreview ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`${showPreview ? 'text-sm' : 'text-base'} font-semibold text-white`}>
                            {comment.userName}
                          </span>
                          {comment.verified && (
                            <div className="flex items-center space-x-1">
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] uppercase tracking-wider font-bold rounded-full border border-green-500/30 flex items-center">
                                <Star className="w-2.5 h-2.5 mr-1 fill-green-400" />
                                Verified Attendee
                              </span>
                            </div>
                          )}
                        </div>
                        {!showPreview && (
                          <span className="text-xs text-gray-400 font-mono">{comment.userWallet}</span>
                        )}
                      </div>
                    </div>
                    {!showPreview && (
                      <div className="flex items-center text-xs text-gray-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(comment.createdAt)}
                      </div>
                    )}
                  </div>
                  <p className={`text-gray-300 ${showPreview ? 'text-xs ml-8 line-clamp-2' : 'text-sm ml-10'}`}>
                    {comment.comment}
                  </p>
                </div>
              ))}
              {showPreview && comments.length > 3 && (
                <div className="text-center py-2">
                  <span className="text-sm text-purple-400">
                    +{comments.length - 3} more comments
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className={`${showPreview ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-2 opacity-50`} />
              <p className={showPreview ? 'text-sm' : ''}>
                {showPreview ? 'No comments yet' : 'No comments yet. Be the first to share your experience!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Unified Submission Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl border border-purple-500/50 max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Share Your Experience</h3>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2 font-semibold">How would you rate this event? (Required)</p>
              <div className="flex space-x-2">
                {renderStars(newRating, true, 'w-8 h-8')}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2 font-semibold">Add a comment (Optional)</p>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share more details about your experience..."
                className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all resize-none"
                rows="4"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitExperience}
                disabled={newRating === 0 || isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentRatingSection;

