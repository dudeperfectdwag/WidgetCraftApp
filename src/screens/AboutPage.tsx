import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';


const { width } = Dimensions.get('window');

const AboutPage = () => {
  // Responsive adjustments
  const isSmallScreen = width < 400;
  return (
    <View style={styles.gradientBg}>
      <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
      <Text style={styles.heading}>About Us</Text>
      <View style={styles.divider} />
        divider: {
          width: '60%',
          height: 4,
          backgroundColor: '#1976d2',
          alignSelf: 'center',
          marginBottom: 18,
          borderRadius: 4,
          marginTop: 4,
        },
      {/* Subheading/Intro */}
      <View style={styles.section}>
        <Text style={styles.subheading}>
          Welcome to WidgetCraft! Discover our story, our team, and what drives us to create innovative widget solutions for everyone.
        </Text>
      </View>
      {/* Mission Statement */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Our Mission</Text>
        <Text style={styles.sectionText}>
          To empower creativity and productivity by delivering high-quality, customizable widget solutions that delight users and solve real-world problems.
        </Text>
      </View>
      {/* Vision Statement */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Our Vision</Text>
        <Text style={styles.sectionText}>
          To be the world’s most trusted platform for widget innovation, inspiring creativity and enabling seamless digital experiences for all.
        </Text>
      </View>
      {/* Company History */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Our History</Text>
        <Image source={{uri: 'https://placehold.co/320x80?text=Company+History'}} style={styles.placeholderImage} resizeMode="cover" />
        <Text style={styles.sectionText}>
          Founded in 2021, WidgetCraft began as a small team of passionate developers and designers. Over the years, we have grown into a leading provider of widget solutions, serving thousands of users worldwide and constantly evolving to meet the needs of our community.
        </Text>
      </View>
      {/* Team Introduction */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Meet the Team</Text>
        <Text style={styles.sectionText}>
          Our diverse team of experts brings together years of experience in design, development, and user experience. We are united by a shared passion for building tools that make a difference.
        </Text>
      </View>
      {/* Team Member Cards */}
      <View style={[styles.section, {alignItems: 'center'}]}>
        <Text style={styles.sectionHeading}>Our Team Members</Text>
        <View style={styles.teamList}>
          {/* Placeholder cards */}
          <View style={styles.teamCard}>
            <Image source={{uri: 'https://placehold.co/48x48?text=AJ'}} style={styles.avatarImage} />
            <Text style={styles.teamName}>Alex Johnson</Text>
            <Text style={styles.teamRole}>Lead Developer</Text>
          </View>
          <View style={styles.teamCard}>
            <Image source={{uri: 'https://placehold.co/48x48?text=JL'}} style={styles.avatarImage} />
            <Text style={styles.teamName}>Jamie Lee</Text>
            <Text style={styles.teamRole}>UI/UX Designer</Text>
          </View>
          <View style={styles.teamCard}>
            <Image source={{uri: 'https://placehold.co/48x48?text=MS'}} style={styles.avatarImage} />
            <Text style={styles.teamName}>Morgan Smith</Text>
            <Text style={styles.teamRole}>Product Manager</Text>
          </View>
        </View>
      </View>
      {/* Company Values */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Our Values</Text>
        <View style={styles.valuesList}>
          <Text style={styles.valueItem}>• Innovation</Text>
          <Text style={styles.valueItem}>• Integrity</Text>
          <Text style={styles.valueItem}>• Collaboration</Text>
          <Text style={styles.valueItem}>• Customer Focus</Text>
          <Text style={styles.valueItem}>• Excellence</Text>
        </View>
      </View>
        valuesList: {
          marginTop: 4,
          marginLeft: 8,
        },
        valueItem: {
          fontSize: 15,
          color: '#1565c0',
          marginBottom: 6,
          fontWeight: '600',
        },
      {/* Value Icons/Illustrations */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>What We Stand For</Text>
        <View style={styles.iconRow}>
          <View style={[styles.valueIcon, {backgroundColor: '#ffb300'}]}><Text style={styles.iconText}>I</Text></View>
          <View style={[styles.valueIcon, {backgroundColor: '#43a047'}]}><Text style={styles.iconText}>IN</Text></View>
          <View style={[styles.valueIcon, {backgroundColor: '#1e88e5'}]}><Text style={styles.iconText}>C</Text></View>
          <View style={[styles.valueIcon, {backgroundColor: '#e53935'}]}><Text style={styles.iconText}>CF</Text></View>
          <View style={[styles.valueIcon, {backgroundColor: '#8e24aa'}]}><Text style={styles.iconText}>E</Text></View>
        </View>
      </View>
        iconRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 8,
          marginBottom: 4,
          gap: 12,
        },
        valueIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          marginHorizontal: 4,
        },
        iconText: {
          color: '#fff',
          fontWeight: '700',
          fontSize: 17,
          letterSpacing: 0.5,
        },
      {/* Timeline/Milestones */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Milestones</Text>
        <View style={styles.timelineList}>
          <View style={styles.timelineItem}>
            <View style={styles.milestoneDot} />
            <Text style={styles.timelineYear}>2021</Text>
            <Text style={styles.timelineText}>WidgetCraft founded</Text>
          </View>
          <View style={styles.timelineItem}>
            <View style={[styles.milestoneDot, {backgroundColor: '#43a047'}]} />
            <Text style={styles.timelineYear}>2022</Text>
            <Text style={styles.timelineText}>Launched first widget suite</Text>
          </View>
          <View style={styles.timelineItem}>
            <View style={[styles.milestoneDot, {backgroundColor: '#1e88e5'}]} />
            <Text style={styles.timelineYear}>2023</Text>
            <Text style={styles.timelineText}>Reached 10,000 users</Text>
          </View>
          <View style={styles.timelineItem}>
            <View style={[styles.milestoneDot, {backgroundColor: '#ffb300'}]} />
            <Text style={styles.timelineYear}>2025</Text>
            <Text style={styles.timelineText}>Expanded to global markets</Text>
          </View>
          milestoneDot: {
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: '#e53935',
            marginRight: 8,
          },
        </View>
      </View>
        timelineList: {
          marginTop: 6,
          marginLeft: 8,
        },
        timelineItem: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
        },
        timelineYear: {
          fontWeight: '700',
          color: '#1565c0',
          width: 54,
          fontSize: 16,
          marginRight: 4,
        },
        timelineText: {
          fontSize: 15,
          color: '#1976d2',
          fontWeight: '500',
        },
      {/* Timeline/Milestone Visuals */}
      <View style={styles.section}>{/* Timeline/milestone visuals here */}</View>
      {/* Awards/Recognition */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Awards & Recognition</Text>
        <Image source={{uri: 'https://placehold.co/320x60?text=Awards'}} style={styles.placeholderImage} resizeMode="cover" />
        <View style={styles.awardsList}>
          <View style={styles.awardItem}>
            <Text style={styles.awardTitle}>Best Widget Platform 2023</Text>
            <Text style={styles.awardSource}>Widget Innovators Guild</Text>
          </View>
          <View style={styles.awardItem}>
            <Text style={styles.awardTitle}>Top UX Design 2024</Text>
            <Text style={styles.awardSource}>Global Design Awards</Text>
          </View>
        </View>
      </View>
          placeholderImage: {
            width: '100%',
            height: 60,
            borderRadius: 8,
            marginBottom: 8,
            backgroundColor: '#e0e0e0',
            opacity: 0.85,
          },
          avatarImage: {
            width: 48,
            height: 48,
            borderRadius: 24,
            marginBottom: 8,
            backgroundColor: '#e0e0e0',
          },
        awardsList: {
          marginTop: 6,
          marginLeft: 8,
        },
        awardItem: {
          marginBottom: 6,
        },
        awardTitle: {
          fontWeight: '700',
          fontSize: 15,
          color: '#1976d2',
          marginBottom: 2,
        },
        awardSource: {
          fontSize: 13,
          color: '#1565c0',
          marginLeft: 2,
          fontWeight: '600',
        },
      {/* Client/Testimonials */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>What Our Clients Say</Text>
        <View style={styles.testimonialList}>
          <Text style={styles.testimonialText}>
            "WidgetCraft transformed our workflow and helped us deliver better results for our customers. Highly recommended!"
          </Text>
          <Text style={styles.testimonialAuthor}>— Taylor, Tech Solutions Inc.</Text>
        </View>
      </View>
        testimonialList: {
          marginTop: 6,
          marginLeft: 8,
        },
        testimonialText: {
          fontSize: 15,
          color: '#1565c0',
          fontStyle: 'italic',
          marginBottom: 6,
          fontWeight: '600',
        },
        testimonialAuthor: {
          fontSize: 13,
          color: '#1976d2',
          marginLeft: 2,
          fontWeight: '600',
        },
      {/* Testimonial Cards */}
      <View style={[styles.section, {alignItems: 'center'}]}>
        <Text style={styles.sectionHeading}>More Client Stories</Text>
        <View style={styles.testimonialCardList}>
          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialCardText}>
              "The flexibility and power of WidgetCraft is unmatched. Our team loves it!"
            </Text>
            <Text style={styles.testimonialCardAuthor}>— Jordan, Creative Studio</Text>
          </View>
          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialCardText}>
              "Excellent support and a fantastic product. WidgetCraft is a game changer."
            </Text>
            <Text style={styles.testimonialCardAuthor}>— Casey, AppWorks</Text>
          </View>
        </View>
      </View>
        testimonialCardList: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 16,
          marginTop: 8,
        },
        testimonialCard: {
          width: 180,
          backgroundColor: '#f9fafc',
          borderRadius: 10,
          padding: 14,
          marginHorizontal: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
          borderWidth: 1,
          borderColor: '#e3e3e3',
        },
        testimonialCardText: {
          fontSize: 14,
          color: '#1565c0',
          fontStyle: 'italic',
          marginBottom: 6,
          fontWeight: '600',
        },
        testimonialCardAuthor: {
          fontSize: 13,
          color: '#1976d2',
          textAlign: 'right',
          fontWeight: '600',
        },
      {/* Call-to-Action (CTA) */}
      <View style={[styles.section, {alignItems: 'center'}]}>
        <Text style={styles.sectionHeading}>Ready to Get Started?</Text>
        <Text style={{fontSize: 15, color: '#444', marginBottom: 12, textAlign: 'center'}}>
          Join thousands of users who trust WidgetCraft to power their creativity and productivity.
        </Text>
        <View style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>Contact Us</Text>
        </View>
      </View>
        ctaButton: {
          backgroundColor: '#1976d2',
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 28,
          alignItems: 'center',
          marginTop: 4,
        },
        ctaButtonText: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 16,
        },
      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Contact Information</Text>
        <Text style={styles.contactText}>Email: support@widgetcraft.com</Text>
        <Text style={styles.contactText}>Phone: (555) 123-4567</Text>
        <Text style={styles.contactText}>Address: 123 Widget Lane, Tech City, USA</Text>
      </View>
        contactText: {
          fontSize: 15,
          color: '#1976d2',
          marginBottom: 6,
          fontWeight: '600',
        },
      {/* Social Media Links */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Follow Us</Text>
        <View style={styles.socialLinksRow}>
          <Text style={styles.socialLink}>Twitter</Text>
          <Text style={styles.socialLink}>Facebook</Text>
          <Text style={styles.socialLink}>LinkedIn</Text>
          <Text style={styles.socialLink}>Instagram</Text>
        </View>
      </View>
        socialLinksRow: {
          flexDirection: 'row',
          gap: 18,
          marginTop: 6,
          marginLeft: 8,
        },
        socialLink: {
          fontSize: 15,
          color: '#1565c0',
          textDecorationLine: 'underline',
          transition: 'color 0.2s',
          cursor: 'pointer',
          fontWeight: '600',
        },
      {/* Company Location/Map */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Our Location</Text>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>[Map Placeholder]</Text>
        </View>
      </View>
        mapPlaceholder: {
          width: '100%',
          height: 120,
          backgroundColor: '#e0e0e0',
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 8,
          marginBottom: 4,
        },
        mapText: {
          color: '#1976d2',
          fontSize: 16,
          fontWeight: '600',
        },
      {/* Press/Media Mentions */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Press & Media</Text>
        <View style={styles.mediaList}>
          <Text style={styles.mediaItem}>
            "WidgetCraft: The Future of Widgets" — Tech Today
          </Text>
          <Text style={styles.mediaItem}>
            "A must-have tool for creators" — App Review Weekly
          </Text>
        </View>
      </View>
        mediaList: {
          marginTop: 6,
          marginLeft: 8,
        },
        mediaItem: {
          fontSize: 15,
          color: '#1976d2',
          marginBottom: 6,
          fontStyle: 'italic',
          fontWeight: '600',
        },
      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          <Text style={styles.faqQ}>Q: Is WidgetCraft free to use?</Text>
          <Text style={styles.faqA}>A: Yes, WidgetCraft offers a free tier with premium features available.</Text>
          <Text style={styles.faqQ}>Q: Can I use WidgetCraft for commercial projects?</Text>
          <Text style={styles.faqA}>A: Absolutely! WidgetCraft is designed for both personal and commercial use.</Text>
        </View>
      </View>
        faqList: {
          marginTop: 6,
          marginLeft: 8,
        },
        faqQ: {
          fontWeight: '700',
          color: '#1565c0',
          fontSize: 16,
          marginBottom: 2,
        },
        faqA: {
          fontSize: 15,
          color: '#1565c0',
          marginBottom: 8,
          fontWeight: '500',
        },
      {/* Accessibility Statement */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Accessibility Statement</Text>
        <Text style={styles.accessibilityText}>
          WidgetCraft is committed to providing an accessible experience for all users. We continually improve our platform to ensure it is usable by everyone, regardless of ability.
        </Text>
      </View>
        accessibilityText: {
          fontSize: 15,
          color: '#1976d2',
          marginTop: 8,
          fontWeight: '600',
        },
      {/* Legal/Disclaimer */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Legal & Disclaimer</Text>
        <Text style={styles.legalText}>
          All product names, trademarks, and registered trademarks are property of their respective owners. Use of WidgetCraft is subject to our terms of service and privacy policy.
        </Text>
      </View>
        legalText: {
          fontSize: 14,
          color: '#1976d2',
          marginTop: 8,
          fontWeight: '600',
        },
      {/* Footer (not linked) */}
      <View style={[styles.section, {alignItems: 'center', backgroundColor: '#f0f0f0'}]}>
        <Text style={styles.footerText}>© 2026 WidgetCraft. All rights reserved.</Text>
      </View>
      footerText: {
        fontSize: 14,
        color: '#1976d2',
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
        paddingVertical: 8,
        borderRadius: 6,
        fontWeight: '600',
      },
      </View>
    </View>
    gradientBg: {
      flex: 1,
      backgroundColor: 'linear-gradient(180deg, #f5f7fa 0%, #c3cfe2 100%)',
    },
  );
};

const styles = StyleSheet.create({
          containerSmall: {
            padding: 8,
          },
          teamList: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 16,
            marginTop: 8,
            flexWrap: 'wrap',
          },
          testimonialCardList: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 16,
            marginTop: 8,
            flexWrap: 'wrap',
          },
        teamList: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 16,
          marginTop: 8,
        },
        teamCard: {
          width: 110,
          alignItems: 'center',
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: 12,
          marginHorizontal: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
        avatarPlaceholder: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: '#e0e0e0',
          marginBottom: 8,
        },
        teamName: {
          fontWeight: '700',
          fontSize: 15,
          color: '#1976d2',
          marginBottom: 4,
        },
        teamRole: {
          fontSize: 13,
          color: '#1565c0',
          fontWeight: '600',
        },
      sectionHeading: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 10,
        color: '#1976d2',
        textAlign: 'left',
      },
      sectionText: {
        fontSize: 16,
        color: '#1565c0',
        textAlign: 'left',
        fontWeight: '500',
        marginBottom: 4,
      },
    subheading: {
      fontSize: 22,
      color: '#1565c0',
      marginBottom: 16,
      fontWeight: '500',
      textAlign: 'center',
    },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heading: {
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1976d2',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginBottom: 28,
    padding: 16,
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
});

export default AboutPage;
