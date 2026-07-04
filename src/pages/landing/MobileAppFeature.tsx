import {
  Menu,
  ArrowLeft,
  Bell,
  Clock,
  Heart,
  MessageSquare,
  Flag,
  HelpCircle,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Wallet,
  Users,
  Signal,
  Wifi,
  Battery,
} from 'lucide-react'
import styles from './MobileAppFeature.module.css'

export default function MobileAppFeature() {
  return (
    <section className={styles.section} id="how-it-works" aria-label="Mobile App Process">
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <span className={styles.eyebrow}>• PROCESS</span>
          <h2 className={styles.headline}>How it Works</h2>
          <p className={styles.subtext}>
            Plan, coordinate, and execute your events in three simple steps
          </p>
        </div>

        {/* Main Content Grid */}
        <div className={styles.mainGrid}>
          {/* Left Column: Larger Interactive Phone Mockup */}
          <div className={styles.phoneColumn}>
            <img
              src="https://i.ibb.co/3mbPvPjq/Gemini-Generated-Image-6xorks6xorks6xor-1.png"
              alt="NaliGrid mobile app interface mockup"
              className={styles.phoneImg}
              style={{ width: '100%', height: 'auto', maxWidth: '375px', display: 'block', margin: '0 auto' }}
            />
            {false && (
              <div className={styles.phone}>
                <img
                  src="https://i.ibb.co/kgdM4Zw3/Gemini-Generated-Image-6xorks6xorks6xor.png"
                  alt="NaliGrid mobile app interface mockup"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '28px', display: 'block' }}
                />
                {/* Notch */}
                <div className={styles.notch}>
                  <div className={styles.speaker} />
                  <div className={styles.camera} />
                </div>
                
                {/* Status Bar */}
                <div className={styles.statusBar}>
                  <span className={styles.statusTime}>9:41</span>
                  <div className={styles.statusIcons}>
                    <Signal size={12} className={styles.statusIcon} />
                    <Wifi size={12} className={styles.statusIcon} />
                    <Battery size={14} className={styles.statusIcon} />
                  </div>
                </div>

                {/* Screen Content - Dark Mode matching the user screenshot */}
                <div className={styles.screen}>
                  
                  {/* Mockup App Header */}
                  <div className={styles.appHeader}>
                    <div className={styles.headerLeft}>
                      <Menu size={16} className={styles.menuIcon} />
                      <ArrowLeft size={16} className={styles.backArrow} />
                    </div>
                    <span className={styles.appTitle}>Live Feed</span>
                    <div className={styles.headerRight}>
                      <span className={styles.bellIcon}>
                        <Bell size={14} />
                        <span className={styles.bellBadge}>2</span>
                      </span>
                      <div className={styles.userAvatar}>CO</div>
                    </div>
                  </div>

                  {/* Feed scroll area */}
                  <div className={styles.mockupList}>
                    
                    {/* Thread Group 1 */}
                    <div className={styles.mockupThread}>
                      {/* Parent Post */}
                      <div className={styles.feedPost}>
                        <div className={styles.postHeader}>
                          <div className={styles.postAvatar}>CO</div>
                          <div className={styles.postMeta}>
                            <span className={styles.postName}>Chinedu Okafor</span>
                            <span className={styles.postTime}>
                              <Clock size={10} style={{ marginRight: 2, display: 'inline-block', verticalAlign: 'middle' }} />
                              10m ago
                            </span>
                          </div>
                        </div>
                        <div className={styles.postContent}>Awards stage setup is complete. Ready for sound check.</div>
                        
                        {/* Integrated Stage Banner */}
                        <div className={styles.bannerCard} style={{ marginTop: 8, height: 90 }}>
                          <img 
                            src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80&auto=format&fit=crop" 
                            className={styles.bannerImg} 
                            alt="Awards reception"
                          />
                        </div>

                        <div className={styles.postFooter}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Heart size={10} /> 3
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <MessageSquare size={10} /> Reply
                          </span>
                          <span className={styles.flagIssue} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Flag size={10} /> Flag
                          </span>
                        </div>
                      </div>

                      {/* Replies Container with Indentation and Visual Connector Line */}
                      <div className={styles.feedRepliesContainer}>
                        <div className={styles.feedPostReply}>
                          <div className={styles.postHeader}>
                            <div className={styles.postAvatar} style={{ background: '#0284c7' }}>TB</div>
                            <div className={styles.postMeta}>
                              <span className={styles.postName}>Tunde Bakare</span>
                              <span className={styles.postTime}>
                                <Clock size={10} style={{ marginRight: 2, display: 'inline-block', verticalAlign: 'middle' }} />
                                5m ago
                              </span>
                            </div>
                          </div>
                          <div className={styles.postContent}>Sound console is live. Microphone testing complete.</div>
                          <div className={styles.postFooter}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Heart size={10} /> 1
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <MessageSquare size={10} /> Reply
                            </span>
                            <span className={styles.flagIssue} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Flag size={10} /> Flag
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post 2: Critical Event Issue */}
                    <div className={`${styles.feedPost} ${styles.flaggedIssueCard}`}>
                      <div className={styles.postHeader}>
                        <div className={styles.postAvatar}>CO</div>
                        <div className={styles.postMeta}>
                          <span className={styles.postName}>Chinedu Okafor</span>
                          <span className={styles.postTime}>
                            <Clock size={10} style={{ marginRight: 2, display: 'inline-block', verticalAlign: 'middle' }} />
                            2m ago
                          </span>
                        </div>
                        <span className={styles.criticalBadge}>Critical Issue</span>
                      </div>
                      <div className={styles.postContent}>
                        Wireless mic feedback on main stage. Audio tech is troubleshooting now.
                      </div>
                      <div className={styles.postFooter}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Heart size={10} /> 0
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <MessageSquare size={10} /> Reply
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#ef4444' }}>
                          <Flag size={10} fill="#ef4444" /> Flagged
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Input row */}
                  <div className={styles.inputRow}>
                    <input className={styles.textInput} placeholder="What's happening?" disabled />
                    <div className={styles.questionBtn}>
                      <HelpCircle size={14} />
                    </div>
                  </div>

                  {/* Bottom Navigation Bar */}
                  <div className={styles.mockupTabBar}>
                    <div className={styles.tabItem}>
                      <LayoutDashboard size={16} className={styles.tabIcon} />
                      <span className={styles.tabLabel}>Dashboard</span>
                    </div>
                    <div className={styles.tabItem}>
                      <CheckSquare size={16} className={styles.tabIcon} />
                      <span className={styles.tabLabel}>My Tasks</span>
                    </div>
                    <div className={`${styles.tabItem} ${styles.tabItemActive}`}>
                      <Calendar size={16} className={styles.tabIcon} />
                      <span className={styles.tabLabel}>Events</span>
                    </div>
                    <div className={styles.tabItem}>
                      <Wallet size={16} className={styles.tabIcon} />
                      <span className={styles.tabLabel}>Financials</span>
                    </div>
                    <div className={styles.tabItem}>
                      <Users size={16} className={styles.tabIcon} />
                      <span className={styles.tabLabel}>Vendors</span>
                    </div>
                  </div>

                </div>

                {/* Bottom Home Indicator Bar */}
                <div className={styles.homeIndicator} />
              </div>
            )}
          </div>

          {/* Right Column: Process steps list */}
          <div className={styles.stepsColumn}>
            {/* Step 1 */}
            <div className={styles.stepRow}>
              <div className={styles.stepIndicatorCol}>
                <div className={styles.stepCircle}>01</div>
                <div className={styles.stepLine} />
              </div>
              <div className={styles.stepTextCol}>
                <span className={styles.stepBadge}>Step 01</span>
                <h3 className={styles.stepTitle}>Download &amp; Setup</h3>
                <p className={styles.stepDesc}>
                  Download NaliGrid and complete the quick 2-minute setup process to get started.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={styles.stepRow}>
              <div className={styles.stepIndicatorCol}>
                <div className={styles.stepCircle}>02</div>
                <div className={styles.stepLine} />
              </div>
              <div className={styles.stepTextCol}>
                <span className={styles.stepBadge}>Step 02</span>
                <h3 className={styles.stepTitle}>Ditch the Walkies</h3>
                <p className={styles.stepDesc}>
                  Coordinate your on-site team instantly with smart updates, announcements, and direct messages, eliminating noisy radio chatter.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={styles.stepRow}>
              <div className={styles.stepIndicatorCol}>
                <div className={`${styles.stepCircle} ${styles.stepCircleActive}`}>03</div>
              </div>
              <div className={styles.stepTextCol}>
                <span className={styles.stepBadge}>Step 03</span>
                <h3 className={styles.stepTitle}>Resolve Issues Live</h3>
                <p className={styles.stepDesc}>
                  Track critical flags on the live event feed and coordinate instantly to solve problems as they happen on event day.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Store Download Buttons (Both Outlined / Secondary style) */}
        <div className={styles.downloadWrapper}>
          <a href="#" className={styles.googleBtn} onClick={(e) => e.preventDefault()}>
            <svg className={styles.storeLogo} viewBox="0 0 512 512" width="22" height="22">
              <path fill="currentColor" d="M325.3 234.3L104.6 13l280.8 161.2zM47 0C34 0 25 9.3 25 22v468c0 12.7 9 22 22 22h8.3L275 256 55.3 0H47zm391 198.3l-55.7 32-55.3 25.7 111 111c12-6.9 20-19.4 20-33.7V232c0-14.3-8-26.8-20-33.7zM385.4 337.8L104.6 499l220.7-126.7z" />
            </svg>
            <div className={styles.btnTextWrap}>
              <span className={styles.btnSub}>Get it on</span>
              <span className={styles.btnTitle}>Google Play</span>
            </div>
          </a>

          <a href="#" className={styles.appleBtn} onClick={(e) => e.preventDefault()}>
            <svg className={styles.storeLogo} viewBox="0 0 384 512" width="22" height="22" fill="currentColor">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-48.4-19.3-76.5-18.8-36 1-68.6 20.9-87.1 53-38 65.9-9.8 163.6 27.3 216.5 18.2 26.2 39.7 55.4 67.9 54.4 27.1-1 37.5-17.5 70.3-17.5 32.8 0 42.4 17.5 70.8 16.9 29-.5 47.9-26.3 65.9-52.9 20.7-30.4 29.1-59.9 29.5-61.4-.8-.4-56.8-21.8-56.9-86.5zm-59.5-181c16.2-19.5 27.2-46.7 24.2-73.7-23.2 1-51.5 15.5-68.2 35.2-14.5 16.9-27.2 44.5-23.8 71 25.8 2 52.8-13 67.8-32.5z"/>
            </svg>
            <div className={styles.btnTextWrap}>
              <span className={styles.btnSub}>Download on the</span>
              <span className={styles.btnTitle}>App Store</span>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}
