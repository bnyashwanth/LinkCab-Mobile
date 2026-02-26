import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    StatusBar,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

const BRAND = {
    yellow: '#FFD700',
    black: '#1A1A1A',
    white: '#FFFFFF',
    gray: '#78716C',
    grayLight: '#F5F5F4',
    grayMedium: '#E5E7EB',
    greenOnline: '#22C55E',
};

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'other';
    time: string;
    type?: 'text' | 'contact_request' | 'travel_plan';
    contactInfo?: { phone?: string; email?: string; location?: string };
    travelPlan?: { meetingPoint?: string; meetingTime?: string; notes?: string };
}

export default function ChatScreen() {
    const router = useRouter();
    const { id, userName } = useLocalSearchParams();
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const [showActions, setShowActions] = useState(false);

    const displayName = typeof userName === 'string' ? userName : 'Sneha Reddy';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    const rideId = typeof id === 'string' ? id.slice(0, 8) : 'user123';

    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: `Hi! I'm interested in your ride.`, sender: 'other', time: '10:30 AM' },
        { id: '2', text: 'Hello! Yes, I have 2 seats available.', sender: 'me', time: '10:31 AM' },
        { id: '3', text: 'Great! What time are you leaving?', sender: 'other', time: '10:32 AM' },
        { id: '4', text: 'Planning to leave around 2:00 PM from MG Road.', sender: 'me', time: '10:33 AM' },
    ]);

    const handleSend = () => {
        if (!message.trim()) return;
        const newMsg: Message = {
            id: Date.now().toString(),
            text: message.trim(),
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, newMsg]);
        setMessage('');
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        // Simulate reply
        setTimeout(() => {
            const replies = [
                "Sounds good! I'll be there on time.",
                "Perfect! Looking forward to the ride.",
                "Thanks for the info. See you then!",
                "Great! Can you share your contact details?",
                "Awesome! Should I bring anything?",
            ];
            const reply: Message = {
                id: (Date.now() + 1).toString(),
                text: replies[Math.floor(Math.random() * replies.length)],
                sender: 'other',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, reply]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }, 2000);
    };

    const handleCall = () => {
        Alert.alert('Call User', 'Would you like to call this user?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => console.log('Calling...') },
        ]);
    };

    const handleShareContact = () => {
        setShowActions(false);
        const contactMsg: Message = {
            id: Date.now().toString(),
            text: '📇 Contact details shared for better coordination.',
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'contact_request',
            contactInfo: { phone: '+91 9876543210', email: 'user@linkcab.in' },
        };
        setMessages(prev => [...prev, contactMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleShareTravelPlan = () => {
        setShowActions(false);
        const planMsg: Message = {
            id: Date.now().toString(),
            text: '🗺️ Travel Plan Created',
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'travel_plan',
            travelPlan: { meetingPoint: 'MG Road Metro Station', meetingTime: '2:00 PM', notes: 'Will be near exit gate 2' },
        };
        setMessages(prev => [...prev, planMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleShareLocation = () => {
        setShowActions(false);
        const locMsg: Message = {
            id: Date.now().toString(),
            text: '📍 Live location shared',
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, locMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isMe = item.sender === 'me';
        const isSpecial = item.type && item.type !== 'text';

        // Check if prev message is from same sender (for grouping)
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const isGrouped = prevMsg?.sender === item.sender;

        return (
            <View style={[
                styles.messageRow,
                isMe ? styles.messageRowMe : styles.messageRowOther,
                isGrouped && { marginTop: 2 },
            ]}>
                {/* Other user avatar (only on first in group) */}
                {!isMe && !isGrouped && (
                    <View style={styles.msgAvatar}>
                        <Text style={styles.msgAvatarText}>{initials.charAt(0)}</Text>
                    </View>
                )}
                {!isMe && isGrouped && <View style={styles.msgAvatarSpacer} />}

                <View style={[
                    styles.bubble,
                    isMe ? styles.bubbleMe : styles.bubbleOther,
                    isSpecial && styles.bubbleSpecial,
                    !isGrouped && !isMe && styles.bubbleOtherFirst,
                    !isGrouped && isMe && styles.bubbleMeFirst,
                ]}>
                    {/* Contact info card */}
                    {item.type === 'contact_request' && item.contactInfo && (
                        <View style={styles.cardInBubble}>
                            {item.contactInfo.phone && (
                                <View style={styles.cardRow}>
                                    <Ionicons name="call" size={14} color={isMe ? BRAND.black : '#6B7280'} />
                                    <Text style={[styles.cardText, isMe && { color: BRAND.black }]}>{item.contactInfo.phone}</Text>
                                </View>
                            )}
                            {item.contactInfo.email && (
                                <View style={styles.cardRow}>
                                    <Ionicons name="mail" size={14} color={isMe ? BRAND.black : '#6B7280'} />
                                    <Text style={[styles.cardText, isMe && { color: BRAND.black }]}>{item.contactInfo.email}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Travel plan card */}
                    {item.type === 'travel_plan' && item.travelPlan && (
                        <View style={styles.cardInBubble}>
                            <View style={styles.cardRow}>
                                <Ionicons name="location" size={14} color={isMe ? BRAND.black : '#6B7280'} />
                                <Text style={[styles.cardText, isMe && { color: BRAND.black }]}>{item.travelPlan.meetingPoint}</Text>
                            </View>
                            <View style={styles.cardRow}>
                                <Ionicons name="time" size={14} color={isMe ? BRAND.black : '#6B7280'} />
                                <Text style={[styles.cardText, isMe && { color: BRAND.black }]}>{item.travelPlan.meetingTime}</Text>
                            </View>
                            {item.travelPlan.notes && (
                                <Text style={[styles.cardNote, isMe && { color: 'rgba(0,0,0,0.5)' }]}>{item.travelPlan.notes}</Text>
                            )}
                        </View>
                    )}

                    {/* Regular text (always shown) */}
                    {(!isSpecial || (isSpecial && item.text)) && (
                        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                            {item.text}
                        </Text>
                    )}

                    <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>
                        {item.time}
                        {isMe && (
                            <Text style={{ color: 'rgba(0,0,0,0.4)' }}> ✓✓</Text>
                        )}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

            {/* ─── Premium Header ─── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={22} color={BRAND.black} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerCenter} activeOpacity={0.8}>
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>{initials}</Text>
                        <View style={styles.onlineDot} />
                    </View>
                    <View>
                        <Text style={styles.headerName}>{displayName}</Text>
                        <Text style={styles.headerStatus}>Online · Ride #{rideId}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerBtn} onPress={handleCall} activeOpacity={0.7}>
                        <Ionicons name="call-outline" size={20} color={BRAND.black} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
                        <Ionicons name="ellipsis-vertical" size={20} color={BRAND.black} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── Messages ─── */}
            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* ─── Quick Actions Tray ─── */}
                {showActions && (
                    <View style={styles.actionsTray}>
                        <TouchableOpacity style={styles.actionItem} onPress={handleShareContact}>
                            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                                <Ionicons name="person-circle-outline" size={22} color="#6366F1" />
                            </View>
                            <Text style={styles.actionLabel}>Contact</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionItem} onPress={handleShareTravelPlan}>
                            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="map-outline" size={22} color="#D97706" />
                            </View>
                            <Text style={styles.actionLabel}>Plan</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionItem} onPress={handleShareLocation}>
                            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="navigate-outline" size={22} color="#16A34A" />
                            </View>
                            <Text style={styles.actionLabel}>Location</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionItem} onPress={() => setShowActions(false)}>
                            <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                                <Ionicons name="close" size={22} color="#DC2626" />
                            </View>
                            <Text style={styles.actionLabel}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ─── Input Bar ─── */}
                <View style={styles.inputBar}>
                    <TouchableOpacity
                        style={styles.attachBtn}
                        onPress={() => setShowActions(!showActions)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name={showActions ? 'close' : 'add'} size={22} color={BRAND.gray} />
                    </TouchableOpacity>

                    <View style={styles.inputWrap}>
                        <TextInput
                            style={styles.input}
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Type a message..."
                            placeholderTextColor="#A8A29E"
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity activeOpacity={0.7}>
                            <Ionicons name="happy-outline" size={20} color="#A8A29E" />
                        </TouchableOpacity>
                    </View>

                    {message.trim() ? (
                        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.85}>
                            <Ionicons name="send" size={18} color={BRAND.black} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.micBtn} activeOpacity={0.7}>
                            <Ionicons name="mic-outline" size={22} color={BRAND.gray} />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BRAND.white,
    },

    // ─── Header ───
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: BRAND.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: BRAND.grayLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    headerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: BRAND.yellow,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: BRAND.black,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: BRAND.greenOnline,
        borderWidth: 2,
        borderColor: BRAND.white,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        color: BRAND.black,
    },
    headerStatus: {
        fontSize: 12,
        color: BRAND.greenOnline,
        fontWeight: '500',
        marginTop: 1,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 6,
    },

    // ─── Messages Area ───
    content: {
        flex: 1,
        backgroundColor: '#F8F8F6',
    },
    messagesList: {
        paddingHorizontal: 14,
        paddingVertical: 16,
        paddingBottom: 8,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 6,
        alignItems: 'flex-end',
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    messageRowOther: {
        justifyContent: 'flex-start',
    },
    msgAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    msgAvatarText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
    },
    msgAvatarSpacer: {
        width: 34,
    },

    // ─── Bubbles ───
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bubbleMe: {
        backgroundColor: BRAND.yellow,
        borderBottomRightRadius: 6,
    },
    bubbleOther: {
        backgroundColor: BRAND.white,
        borderBottomLeftRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    bubbleMeFirst: {
        borderTopRightRadius: 20,
    },
    bubbleOtherFirst: {
        borderTopLeftRadius: 20,
    },
    bubbleSpecial: {
        maxWidth: '82%',
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 21,
    },
    bubbleTextMe: {
        color: BRAND.black,
    },
    bubbleTextOther: {
        color: '#1F2937',
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    timeTextMe: {
        color: 'rgba(0,0,0,0.45)',
    },
    timeTextOther: {
        color: '#9CA3AF',
    },

    // ─── Special message cards ───
    cardInBubble: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 10,
        padding: 10,
        marginBottom: 6,
        gap: 6,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    cardNote: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#6B7280',
        marginTop: 2,
    },

    // ─── Quick Actions Tray ───
    actionsTray: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: BRAND.white,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        justifyContent: 'space-around',
    },
    actionItem: {
        alignItems: 'center',
        gap: 6,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: BRAND.gray,
    },

    // ─── Input Bar ───
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: BRAND.white,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        gap: 6,
    },
    attachBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: BRAND.grayLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    inputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F4',
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 10 : 4,
        minHeight: 42,
        maxHeight: 100,
        gap: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: BRAND.black,
        paddingVertical: 0,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: BRAND.yellow,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 1,
    },
    micBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 1,
    },
});
