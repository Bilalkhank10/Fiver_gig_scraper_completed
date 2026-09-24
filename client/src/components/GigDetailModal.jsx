import React, { useState } from 'react';
import {
  X, ExternalLink, Star, Clock, Check, ShieldCheck,
  Award, Globe, MessageSquare, ChevronRight, ChevronLeft,
  DollarSign, Sparkles, UserCheck, HelpCircle, FileText
} from 'lucide-react';
import { formatPrice } from '../services/currency';

export default function GigDetailModal({ gig, onClose, onAddToCompare, currencyCode = 'USD' }) {
  if (!gig) return null;

  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'seller' | 'reviews' | 'faq'

  const gallery = gig.gallery && gig.gallery.length > 0
    ? gig.gallery
    : gig.thumbnail ? [{ url: gig.thumbnail }] : [];

  const packages = gig.packages || [];
  const seller = gig.seller || {};
  const reviews = gig.reviews || [];
  const reviewsSummary = gig.reviews_summary || {};
  const faq = gig.faq || [];

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/80 backdrop-blur-md overflow-y-auto cursor-pointer"
    >
      
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-[#0d131f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col cursor-default"
      >
        
        {/* Top Header Bar */}
        <div className="p-6 border-b border-white/10 bg-slate-900/60 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                Position #{gig.position || 'Listing'}
              </span>
              {gig.is_promoted && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px]">
                  Sponsored Ad
                </span>
              )}
              {gig.isFiverrChoice && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold uppercase text-[10px]">
                  Fiverr's Choice
                </span>
              )}
              {gig.category && (
                <span className="text-slate-400">
                  {gig.category} {gig.subcategory ? `› ${gig.subcategory}` : ''}
                </span>
              )}
            </div>

            <h2 className="text-lg md:text-xl font-bold text-white leading-tight">
              {gig.title}
            </h2>

            <div className="flex items-center space-x-3 text-xs text-slate-300 pt-1">
              <div className="flex items-center space-x-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-white">{gig.rating || gig.seller_rating_score || 5.0}</span>
                <span className="text-slate-400">({gig.rating_count || gig.buying_review_count || 0} reviews)</span>
              </div>
              <span className="text-slate-600">•</span>
              <span>Starting at <strong className="text-emerald-400 font-mono">{formatPrice(gig.starting_price, currencyCode)}</strong></span>
              {gig.orders_in_queue != null && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-cyan-400 font-medium">{gig.orders_in_queue} orders in queue</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {gig.url && (
              <a
                href={gig.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-white/5"
              >
                <span>Fiverr Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Gallery Carousel & Quick Specs */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Gallery Media (7 cols) */}
            <div className="md:col-span-7 space-y-3">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-white/5">
                {gallery.length > 0 ? (
                  <img
                    src={gallery[activeSlide]?.url || gig.thumbnail}
                    alt="Gig showcase"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    No image preview
                  </div>
                )}

                {gallery.length > 1 && (
                  <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={() => setActiveSlide(s => (s > 0 ? s - 1 : gallery.length - 1))}
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md pointer-events-auto transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSlide(s => (s < gallery.length - 1 ? s + 1 : 0))}
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md pointer-events-auto transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnails strip */}
              {gallery.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {gallery.map((g, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-12 w-20 rounded-lg overflow-hidden border flex-shrink-0 transition-all ${
                        activeSlide === idx ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={g.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Seller Snapshot Card (5 cols) */}
            <div className="md:col-span-5 glass-panel rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-800 border-2 border-emerald-500/40 flex-shrink-0">
                    {seller.profile_image || gig.seller_profileImage ? (
                      <img
                        src={seller.profile_image || gig.seller_profileImage}
                        alt={seller.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-300 text-lg">
                        {(seller.username || gig.seller_username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {seller.display_name || seller.username || gig.seller_displayName || gig.seller_username}
                    </h4>
                    <p className="text-xs text-slate-400">@{seller.username || gig.seller_username}</p>
                    <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 mt-1 border border-emerald-500/30">
                      {seller.level || gig.seller_level || 'Seller'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                  <div className="bg-slate-900/60 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">From</span>
                    <strong className="text-slate-200">{seller.country || gig.seller_country || 'Global'}</strong>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Avg Response</span>
                    <strong className="text-slate-200">{seller.response_time_hours ? `${seller.response_time_hours} hours` : 'Fast'}</strong>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Member Since</span>
                    <strong className="text-slate-200">{seller.member_since || 'Active Member'}</strong>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Completed</span>
                    <strong className="text-emerald-400 font-mono">{seller.completed_orders || `${gig.buying_review_count || 100}+`} orders</strong>
                  </div>
                </div>

                {seller.bio && (
                  <p className="text-xs text-slate-300 line-clamp-3 italic pt-1">
                    "{seller.bio}"
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onAddToCompare(gig)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/5 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Add to Comparison Matrix</span>
                </button>
              </div>
            </div>

          </div>

          {/* Dossier Tabs */}
          <div className="space-y-4 pt-2">
            <div className="flex border-b border-white/10 space-x-4 text-xs font-bold">
              <button
                onClick={() => setActiveTab('packages')}
                className={`pb-3 border-b-2 transition-all flex items-center space-x-1.5 ${
                  activeTab === 'packages'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span>3-Tier Packages ({packages.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('seller')}
                className={`pb-3 border-b-2 transition-all flex items-center space-x-1.5 ${
                  activeTab === 'seller'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Seller Dossier & Skills</span>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 border-b-2 transition-all flex items-center space-x-1.5 ${
                  activeTab === 'reviews'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Buyer Reviews ({reviews.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className={`pb-3 border-b-2 transition-all flex items-center space-x-1.5 ${
                  activeTab === 'faq'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="h-4 w-4" />
                <span>FAQ & Description</span>
              </button>
            </div>

            {/* TAB: Packages */}
            {activeTab === 'packages' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {packages.length > 0 ? (
                  packages.map((pkg, idx) => (
                    <div
                      key={pkg.id || idx}
                      className={`glass-panel rounded-2xl p-5 border flex flex-col justify-between space-y-4 ${
                        idx === 1 ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-white/10'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Tier {idx + 1}
                          </span>
                          <span className="text-xl font-black text-emerald-400 font-mono">
                            {formatPrice(pkg.price || gig.starting_price || 35, currencyCode)}
                          </span>
                        </div>

                        <h5 className="text-sm font-bold text-white">{pkg.title || `Package ${idx + 1}`}</h5>
                        <p className="text-xs text-slate-300 leading-relaxed min-h-[40px]">
                          {pkg.description || 'Standard high quality delivery deliverable with source files.'}
                        </p>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3.5 w-3.5 text-cyan-400" />
                            <span>{pkg.delivery_days || gig.delivery_days || 2} Days Delivery</span>
                          </div>
                          <span>
                            {pkg.revisions_unlimited ? 'Unlimited Revisions' : `${pkg.revisions || 2} Revisions`}
                          </span>
                        </div>

                        {/* Features Checklist */}
                        {pkg.features && pkg.features.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Included:</span>
                            {pkg.features.map((feat, fIdx) => (
                              <div key={fIdx} className="flex items-center space-x-2 text-xs">
                                <Check className={`h-3.5 w-3.5 ${feat.included ? 'text-emerald-400' : 'text-slate-600'}`} />
                                <span className={feat.included ? 'text-slate-200' : 'text-slate-500 line-through'}>
                                  {feat.label || feat.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 text-slate-400 text-xs">
                    Package breakdown not extracted for this listing. Run in <strong>Deep Details Mode</strong> to fetch all 3 package tiers.
                  </div>
                )}
              </div>
            )}

            {/* TAB: Seller */}
            {activeTab === 'seller' && (
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">Languages</h4>
                  <p className="text-xs text-slate-300">{seller.languages || gig.seller_languages || 'English (Fluent)'}</p>
                </div>

                {seller.skills && seller.skills.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-sm font-bold text-white">Skills & Expertise</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {seller.skills.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {seller.education && seller.education.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-sm font-bold text-white">Education</h4>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      {seller.education.map((e, idx) => (
                        <li key={idx}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((r, idx) => (
                    <div key={r.id || idx} className="glass-panel p-4 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 text-[10px]">
                            {(r.reviewer || 'B')[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-white">{r.reviewer || 'Verified Buyer'}</span>
                          {r.reviewer_country && (
                            <span className="text-slate-400 font-mono">[{r.reviewer_country}]</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-white">{r.rating || 5}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed">
                        "{r.comment}"
                      </p>

                      {r.seller_response && (
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] text-slate-400 italic">
                          <strong className="text-emerald-400 not-italic">Seller response:</strong> {r.seller_response}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No individual reviews attached. Run in <strong>Deep Details Mode</strong> to extract buyer testimonials.
                  </div>
                )}
              </div>
            )}

            {/* TAB: FAQ & Description */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                {gig.description && (
                  <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
                    <h4 className="text-sm font-bold text-white">Full Gig Description</h4>
                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                      {gig.description}
                    </p>
                  </div>
                )}

                {faq.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-white">Frequently Asked Questions</h4>
                    {faq.map((q, idx) => (
                      <div key={idx} className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
                        <p className="text-xs font-bold text-emerald-300">Q: {q.question}</p>
                        <p className="text-xs text-slate-300">A: {q.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
