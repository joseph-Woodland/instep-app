import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';

interface GuideTipModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (tip: string) => void;
}

export const GuideTipModal: React.FC<GuideTipModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const [tip, setTip] = useState('');

    const handleSubmit = () => {
        if (tip.trim()) {
            onSubmit(tip.trim());
            setTip('');
            onClose();
        }
    };

    const handleClose = () => {
        setTip('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.overlay}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Share a tip</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.description}>
                        Share something that helped you at this stage of the journey.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="What helped you at this stage?"
                        placeholderTextColor="#999"
                        value={tip}
                        onChangeText={setTip}
                        multiline
                        numberOfLines={4}
                        maxLength={300}
                        autoFocus
                    />

                    <Text style={styles.charCount}>{tip.length}/300</Text>

                    <PrimaryButton
                        title="Share tip"
                        onPress={handleSubmit}
                        disabled={!tip.trim()}
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modal: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        fontSize: 18,
        color: colors.textLight,
    },
    description: {
        fontSize: 14,
        color: colors.textLight,
        marginBottom: 16,
        lineHeight: 20,
    },
    input: {
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.text,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    charCount: {
        fontSize: 12,
        color: colors.textLight,
        textAlign: 'right',
        marginBottom: 16,
    },
});
