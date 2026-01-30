import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Gift, Copy, Check, ExternalLink, ChevronDown } from 'lucide-react';

export default function ReferralDashboard() {
  const { user } = useContext(AuthContext);
  const [referralData, setReferralData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setReferralData(userDoc.data().referral);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}?ref=${referralData.code}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <div className="text-center text-gray-600">Loading referral information...</div>
      </div>
    );
  }

  if (!referralData) return null;

  const referralLink = `${window.location.origin}?ref=${referralData.code}`;
  const progressToNextReward = referralData.totalReferrals % 5;
  const nextMilestone = Math.ceil(referralData.totalReferrals / 5) * 5;
  const bonusRemaining = referralData.bonusCredits - referralData.bonusCreditsUsed;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
      {/* Clickable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-100/50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          <Gift className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900">Refer Friends & Earn Bonus Credits</h3>
        </div>
        <div className="flex items-center gap-4">
          {/* Summary stats when collapsed */}
          {!isExpanded && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-900">{referralData.totalReferrals}</span>
                <span className="text-gray-600">referrals</span>
              </div>
              <div className="flex items-center gap-1">
                <Gift className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-900">{bonusRemaining}</span>
                <span className="text-gray-600">bonus credits</span>
              </div>
            </div>
          )}
          <ChevronDown
            className={`w-5 h-5 text-purple-600 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          <p className="text-gray-600">
            Share your referral link! Every 5 friends who sign up earns you <strong>5 bonus optimizations</strong>.
            Your friends get <strong>1 bonus optimization</strong> when they join!
          </p>

          {/* Referral Link */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Referral Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{referralData.totalReferrals}</div>
              <div className="text-xs text-gray-600">Total Referrals</div>
            </div>

            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
              <Gift className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{bonusRemaining}</div>
              <div className="text-xs text-gray-600">Bonus Credits Left</div>
            </div>

            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
              <ExternalLink className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{referralData.bonusCredits}</div>
              <div className="text-xs text-gray-600">Total Earned</div>
            </div>
          </div>

          {/* Progress to Next Reward */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700">Progress to next reward</span>
              <span className="font-semibold text-purple-600">
                {progressToNextReward} / 5 referrals
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(progressToNextReward / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {5 - progressToNextReward} more {5 - progressToNextReward === 1 ? 'referral' : 'referrals'} until you earn 5 bonus credits!
            </p>
          </div>

          {/* Rewards History */}
          {referralData.referralRewards && referralData.referralRewards.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Recent Rewards</h4>
              <div className="space-y-2">
                {referralData.referralRewards.slice(-3).reverse().map((reward, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">
                      Milestone: {reward.milestoneTrigger} referrals
                    </span>
                    <span className="font-semibold text-green-600">+{reward.creditsEarned} credits</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
