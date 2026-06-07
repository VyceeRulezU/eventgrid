import { 
  Calendar, Sparkles, Bell, Tv, 
  Share2, Mic, Check, Shield, Briefcase, 
  Plus, Edit3, CalendarRange, Clock 
} from 'lucide-react'
import styles from './FeaturesSection.module.css'

export default function FeaturesSection() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.container}>
        
        {/* ── BLOCK 1: Explore Our Event Website Offers ── */}
        <div className={styles.featureRow}>
          {/* Text content left */}
          <div className={styles.textContent}>
            <span className={styles.badge}>Website Features</span>
            <h2 className={styles.rowTitle}>Explore Our Event Website Offers</h2>
            <p className={styles.rowDesc}>
              Our interactive schedule allows attendees to easily view and plan their day. It offers 
              a user-friendly interface where participants can explore session details, speakers, and event locations.
            </p>
            
            <div className={styles.subGrid}>
              <div className={styles.subItem}>
                <div className={styles.iconWrapper}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className={styles.subTitle}>Interactive Schedule</h3>
                  <p className={styles.subDesc}>Easily navigate and plan your day with interactive schedules.</p>
                </div>
              </div>
              
              <div className={styles.subItem}>
                <div className={styles.iconWrapper}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className={styles.subTitle}>Exclusive Content</h3>
                  <p className={styles.subDesc}>Get access to exclusive sessions that will elevate your knowledge.</p>
                </div>
              </div>
              
              <div className={styles.subItem}>
                <div className={styles.iconWrapper}>
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className={styles.subTitle}>Event Updates</h3>
                  <p className={styles.subDesc}>Stay informed with real-time updates and announcements.</p>
                </div>
              </div>
              
              <div className={styles.subItem}>
                <div className={styles.iconWrapper}>
                  <Tv size={18} />
                </div>
                <div>
                  <h3 className={styles.subTitle}>Live Streaming</h3>
                  <p className={styles.subDesc}>Experience the event from anywhere with seamless live streaming.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mockup Card 1: Checklist Right */}
          <div className={styles.visualContent}>
            <div className={styles.checklistCard}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Checklist</h4>
                <div className={styles.plusButton}>
                  <Plus size={16} />
                </div>
              </div>
              
              {/* Business Section */}
              <div className={styles.cardGroup}>
                <div className={styles.groupHeader}>
                  <div className={`${styles.groupIcon} ${styles.blue}`}>
                    <Briefcase size={14} />
                  </div>
                  <span className={styles.groupName}>Business</span>
                </div>
                <div className={styles.checkItem}>
                  <div className={styles.checkBoxActive}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className={styles.checkLabel}>Turn on chat during session</span>
                </div>
                <div className={styles.checkItem}>
                  <div className={styles.checkBoxActive}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className={styles.checkLabel}>Turn on chat during session</span>
                </div>
              </div>
              
              {/* Private Section */}
              <div className={styles.cardGroup}>
                <div className={styles.groupHeader}>
                  <div className={`${styles.groupIcon} ${styles.purple}`}>
                    <Shield size={14} />
                  </div>
                  <span className={styles.groupName}>Private</span>
                </div>
                <div className={styles.checkItem}>
                  <div className={styles.checkBoxActive}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className={styles.checkLabel}>Turn on chat during session</span>
                </div>
                <div className={styles.checkItem}>
                  <div className={styles.checkBoxActive}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className={styles.checkLabel}>Turn on chat during session</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ── BLOCK 2: Key Features of Our Event Website ── */}
        <div className={`${styles.featureRow} ${styles.reverse}`}>
          {/* Mockup Card 2: Create an Event Left */}
          <div className={styles.visualContent}>
            <div className={styles.createCard}>
              <div className={styles.createHeader}>
                <h4 className={styles.createCardTitle}>Create an Event</h4>
                <div className={styles.editBtn}>
                  <Edit3 size={14} />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Title</label>
                <input type="text" readOnly value="Eko Wedding 2025" className={styles.formInput} />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Color</label>
                <div className={styles.colorRow}>
                  <div className={`${styles.colorDot} ${styles.red}`} />
                  <div className={`${styles.colorDot} ${styles.orange}`} />
                  <div className={`${styles.colorDot} ${styles.yellow}`} />
                  <div className={`${styles.colorDot} ${styles.green} ${styles.activeColor}`} />
                  <div className={`${styles.colorDot} ${styles.blue}`} />
                  <div className={`${styles.colorDot} ${styles.purple}`} />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date</label>
                <div className={styles.inputWithIcon}>
                  <input type="text" readOnly value="Friday, 14 Oct 2023" className={styles.formInput} />
                  <CalendarRange size={16} className={styles.inputIcon} />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroupHalf}>
                  <label className={styles.formLabel}>Start Time</label>
                  <div className={styles.inputWithIcon}>
                    <input type="text" readOnly value="15:00" className={styles.formInput} />
                    <Clock size={16} className={styles.inputIcon} />
                  </div>
                </div>
                <div className={styles.formGroupHalf}>
                  <label className={styles.formLabel}>End Time</label>
                  <div className={styles.inputWithIcon}>
                    <input type="text" readOnly value="20:00" className={styles.formInput} />
                    <Clock size={16} className={styles.inputIcon} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Text content right */}
          <div className={styles.textContent}>
            <span className={styles.badge}>Website Features</span>
            <h2 className={styles.rowTitle}>Key Features of Our Event Website</h2>
            <p className={styles.rowDesc}>
              Easily navigate and plan your day with our interactive schedule. Attendees can view 
              session details, speaker information, locations, personalize their agenda, and receive notifications for upcoming sessions.
            </p>
            
            <div className={styles.subGridTwo}>
              <div className={styles.subItem}>
                <div className={styles.iconWrapper}>
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 className={styles.subTitle}>Social Integration</h3>
                  <p className={styles.subDesc}>Connect and interact with us and fellow attendees on various social media platforms.</p>
                </div>
              </div>
              
              <div className={styles.subItem}>
                <div className={styles.iconWrapper}>
                  <Mic size={18} />
                </div>
                <div>
                  <h3 className={styles.subTitle}>Speaker Lineup</h3>
                  <p className={styles.subDesc}>This feature highlights the profiles of keynote speakers, panelists, and workshop leaders.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
