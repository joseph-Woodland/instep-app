import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

interface CheckInModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (note: string, milestoneId: string | null, photoBase64: string | null) => Promise<void>;
    milestones: { id: string; title: string }[];
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ visible, onClose, onSubmit, milestones }) => {
    const [note, setNote] = useState('');
    const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<string | null>(null);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage(result.assets[0].base64 || null);
        }
    };

    const handleSubmit = async () => {
        if (!note.trim()) return;
        setLoading(true);
        try {
            await onSubmit(note, selectedMilestone, image);
            setNote('');
            setSelectedMilestone(null);
            setImage(null);
            onClose();
        } catch (e) {
            console.error("CheckIn submit failed", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Daily Check-In</Text>
                    <Text style={styles.label}>How did today go?</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Went for a light jog, felt good!"
                        multiline
                        numberOfLines={3}
                        value={note}
                        onChangeText={setNote}
                    />

                    {/* 
                    <Text style={styles.label}>Add a photo</Text>
                    <View style={styles.photoContainer}>
                        {image ? (
                            <View style={styles.imageWrapper}>
                                <Image source={{ uri: `data:image/jpeg;base64,${image}` }} style={styles.previewImage} />
                                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
                                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                                <Ionicons name="camera" size={24} color={colors.primary} />
                                <Text style={styles.addPhotoText}>Select Photo</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                     */}

                    <Text style={styles.label}>Did you complete a milestone?</Text>
                    <View style={styles.milestoneList}>
                        <TouchableOpacity
                            style={[styles.milestoneChip, !selectedMilestone && styles.milestoneChipSelected]}
                            onPress={() => setSelectedMilestone(null)}
                        >
                            <Text style={[styles.milestoneText, !selectedMilestone && styles.milestoneTextSelected]}>
                                None
                            </Text>
                        </TouchableOpacity>

                        {milestones.map((ms) => (
                            <TouchableOpacity
                                key={ms.id}
                                style={[styles.milestoneChip, selectedMilestone === ms.id && styles.milestoneChipSelected]}
                                onPress={() => setSelectedMilestone(ms.id)}
                            >
                                <Text style={[styles.milestoneText, selectedMilestone === ms.id && styles.milestoneTextSelected]}>
                                    {ms.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.buttons}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <View style={styles.submitButtonWrapper}>
                            {loading ? (
                                <ActivityIndicator color={colors.primary} />
                            ) : (
                                <PrimaryButton
                                    title="Save Check-In"
                                    onPress={handleSubmit}
                                    disabled={!note.trim()}
                                    style={{ opacity: !note.trim() ? 0.5 : 1 }}
                                />
                            )}
                        </View>
                    </View>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        minHeight: 400,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        backgroundColor: '#F7F7F7',
        borderRadius: 12,
        padding: 12,
        height: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
        color: colors.text,
        fontSize: 16,
    },
    milestoneList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    milestoneChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: colors.white,
    },
    milestoneChipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    milestoneText: {
        fontSize: 14,
        color: colors.text,
    },
    milestoneTextSelected: {
        color: colors.white,
        fontWeight: '600',
    },
    buttons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    cancelButton: {
        padding: 16,
    },
    cancelText: {
        color: colors.textLight,
        fontSize: 16,
        fontWeight: '500',
    },
    submitButtonWrapper: {
        flex: 1,
    },
    // Photo Upload Styles
    photoContainer: {
        marginBottom: 20,
    },
    imageWrapper: {
        position: 'relative',
        width: 120,
        height: 120,
    },
    previewImage: {
        width: 120,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    removeImageBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    addPhotoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    addPhotoText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    }
});
