import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, FlatList, StyleSheet, Pressable, Alert, RefreshControl,
  Modal, ScrollView, KeyboardAvoidingView, Platform, TextInput as RNTextInput,
} from 'react-native';
import { Text, useTheme, Switch, ActivityIndicator, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { storesApi, menuApi } from '@/api/stores';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuItem } from '@/api/types';
import { formatCurrency } from '@/utils';
import { spacing, radius } from '@/theme';

// ── Add/Edit item form modal ─────────────────────────────────────────────────

interface ItemFormState {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
}

const EMPTY_FORM: ItemFormState = { name: '', description: '', price: '', category: '', image_url: '' };

function AddItemModal({
  visible,
  storeId,
  onClose,
  onCreated,
}: {
  visible: boolean;
  storeId: string;
  onClose: () => void;
  onCreated: (item: MenuItem) => void;
}) {
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const priceRef = useRef<any>(null);
  const categoryRef = useRef<any>(null);
  const descRef = useRef<any>(null);

  const set = (key: keyof ItemFormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Missing field', 'Item name is required.');
      return;
    }
    const priceNum = parseFloat(form.price);
    if (!form.price || isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid price', 'Enter a valid price greater than 0.');
      return;
    }

    setSaving(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const formData = new FormData();
      formData.append('store_id', storeId);
      formData.append('name', form.name.trim());
      formData.append('price', priceNum.toString());
      if (form.description.trim()) formData.append('description', form.description.trim());
      if (form.category.trim()) formData.append('category', form.category.trim());
      if (form.image_url.trim()) formData.append('image_url', form.image_url.trim());

      const { data } = await menuApi.create(formData);
      if (data.success && data.data) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onCreated(data.data);
        setForm(EMPTY_FORM);
        onClose();
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Failed to create item.');
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof ItemFormState,
    opts?: {
      placeholder?: string;
      keyboardType?: 'default' | 'decimal-pad' | 'url';
      ref?: any;
      nextRef?: any;
      multiline?: boolean;
      icon?: string;
    },
  ) => (
    <TextInput
      ref={opts?.ref}
      label={label}
      value={form[key]}
      onChangeText={set(key)}
      mode="outlined"
      keyboardType={opts?.keyboardType ?? 'default'}
      placeholder={opts?.placeholder}
      multiline={opts?.multiline}
      numberOfLines={opts?.multiline ? 3 : 1}
      returnKeyType={opts?.nextRef ? 'next' : 'done'}
      onSubmitEditing={() => opts?.nextRef?.current?.focus()}
      style={styles.modalInput}
      outlineStyle={{ borderRadius: radius.md }}
      left={opts?.icon ? <TextInput.Icon icon={opts.icon} /> : undefined}
    />
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: c.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Modal header */}
        <View style={[styles.modalHeader, { backgroundColor: c.elevation.level2, borderBottomColor: c.outlineVariant }]}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.modalClose}>
            <MaterialCommunityIcons name="close" size={22} color={c.onSurfaceVariant} />
          </Pressable>
          <Text style={[styles.modalTitle, { color: c.onSurface }]}>New Menu Item</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={saving}
            style={({ pressed }) => [
              styles.modalSaveBtn,
              { backgroundColor: c.primary, opacity: pressed || saving ? 0.8 : 1 },
            ]}
          >
            {saving
              ? <ActivityIndicator size={16} color={c.onPrimary} />
              : <Text style={[styles.modalSaveBtnText, { color: c.onPrimary }]}>Add</Text>
            }
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Required fields */}
          <Text style={[styles.formSection, { color: c.onSurfaceVariant }]}>REQUIRED</Text>
          {field('Item name *', 'name', { placeholder: 'e.g. Masala Chai', nextRef: priceRef, icon: 'food-outline' })}
          {field('Price (₹) *', 'price', { keyboardType: 'decimal-pad', placeholder: '0.00', ref: priceRef, nextRef: categoryRef, icon: 'currency-inr' })}

          {/* Optional fields */}
          <Text style={[styles.formSection, { color: c.onSurfaceVariant, marginTop: spacing.md }]}>OPTIONAL</Text>
          {field('Category', 'category', { placeholder: 'e.g. Beverages', ref: categoryRef, nextRef: descRef, icon: 'tag-outline' })}
          {field('Description', 'description', { placeholder: 'Short description…', multiline: true, ref: descRef, icon: 'text-long' })}
          {field('Image URL', 'image_url', { keyboardType: 'url', placeholder: 'https://…', icon: 'image-outline' })}

          {form.image_url.trim().length > 0 && (
            <View style={[styles.imagePreviewWrap, { backgroundColor: c.surfaceVariant }]}>
              <Image
                source={{ uri: form.image_url.trim() }}
                style={styles.imagePreview}
                contentFit="cover"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Menu item row ────────────────────────────────────────────────────────────

function MenuItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: MenuItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { colors: c } = useTheme();

  return (
    <View
      style={[
        styles.itemCard,
        {
          backgroundColor: item.is_available ? c.surface : c.surfaceVariant + '88',
          borderColor: c.outlineVariant,
        },
      ]}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.itemImage} contentFit="cover" />
      ) : (
        <View style={[styles.itemImagePlaceholder, { backgroundColor: c.primaryContainer }]}>
          <MaterialCommunityIcons name="food-outline" size={24} color={c.onPrimaryContainer} />
        </View>
      )}

      <View style={{ flex: 1, marginHorizontal: spacing.md }}>
        <Text style={[styles.itemName, { color: item.is_available ? c.onSurface : c.onSurfaceVariant }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.category ? (
          <View style={[styles.categoryChip, { backgroundColor: c.primaryContainer }]}>
            <Text style={[styles.categoryText, { color: c.onPrimaryContainer }]}>{item.category}</Text>
          </View>
        ) : null}
        <Text style={[styles.itemPrice, { color: item.is_available ? c.primary : c.onSurfaceVariant }]}>
          {formatCurrency(item.price)}
        </Text>
      </View>

      <View style={styles.itemActions}>
        <Switch
          value={item.is_available}
          onValueChange={onToggle}
        />
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <MaterialCommunityIcons name="delete-outline" size={20} color={c.error} />
        </Pressable>
      </View>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function MenuManagementScreen() {
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Step 1: Resolve own store once
  useEffect(() => {
    storesApi.list()
      .then(({ data }) => {
        console.log('[Menu] stores response:', JSON.stringify(data).slice(0, 300));
        console.log('[Menu] user._id:', user?._id);
        if (data.success) {
          const stores = data.data as any[];
          console.log('[Menu] store owner_ids:', stores.map((s) => s.owner_id));
          const myStore = stores.find((s) => s.owner_id === user?._id);
          console.log('[Menu] myStore:', myStore?._id ?? 'NOT FOUND');
          if (myStore) {
            setStoreId(myStore._id);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      })
      .catch((e) => { console.log('[Menu] stores list error:', e.message); setLoading(false); });
  }, [user?._id]);

  // Step 2: Fetch menu when storeId is known
  const fetchMenu = useCallback(async () => {
    if (!storeId) return;
    try {
      const { data } = await storesApi.menu(storeId);
      console.log('[Menu] menu response:', JSON.stringify(data).slice(0, 300));
      if (data.success) setMenu(data.data?.menuItems ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const handleToggle = async (item: MenuItem) => {
    await Haptics.selectionAsync();
    setMenu((prev) => prev.map((i) => i._id === item._id ? { ...i, is_available: !i.is_available } : i));
    try {
      await menuApi.toggleAvailability(item._id);
    } catch {
      // Revert on failure
      setMenu((prev) => prev.map((i) => i._id === item._id ? { ...i, is_available: item.is_available } : i));
      Alert.alert('Error', 'Failed to update availability.');
    }
  };

  const handleDelete = (item: MenuItem) => {
    Alert.alert(
      `Delete "${item.name}"?`,
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await menuApi.delete(item._id);
              setMenu((prev) => prev.filter((i) => i._id !== item._id));
            } catch {
              Alert.alert('Error', 'Failed to delete item.');
            }
          },
        },
      ],
    );
  };

  const available = menu.filter((i) => i.is_available).length;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: c.elevation.level2 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: c.onSurface }]}>Menu</Text>
          {!loading && (
            <Text style={[styles.headerSub, { color: c.onSurfaceVariant }]}>
              {available} of {menu.length} available
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={({ pressed }) => [styles.addBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={c.onPrimary} />
          <Text style={[styles.addBtnText, { color: c.onPrimary }]}>Add Item</Text>
        </Pressable>
      </View>

      <FlatList
        data={menu}
        keyExtractor={(i) => i._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchMenu(); }}
            colors={[c.primary]}
            tintColor={c.primary}
          />
        }
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 24 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}><ActivityIndicator color={c.primary} /></View>
          ) : (
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: c.surfaceVariant }]}>
                <MaterialCommunityIcons name="food-off-outline" size={40} color={c.onSurfaceVariant} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.onSurface }]}>No items yet</Text>
              <Text style={[styles.emptySub, { color: c.onSurfaceVariant }]}>
                Tap "Add Item" to build your menu
              </Text>
              <Pressable
                onPress={() => setShowAddModal(true)}
                style={({ pressed }) => [styles.emptyAddBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
              >
                <MaterialCommunityIcons name="plus" size={16} color={c.onPrimary} />
                <Text style={[styles.emptyAddBtnText, { color: c.onPrimary }]}>Add First Item</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => (
          <MenuItemRow
            item={item}
            onToggle={() => handleToggle(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      {storeId && (
        <AddItemModal
          visible={showAddModal}
          storeId={storeId}
          onClose={() => setShowAddModal(false)}
          onCreated={(newItem) => setMenu((prev) => [newItem, ...prev])}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  addBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // Item card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    overflow: 'hidden',
  },
  itemImage: { width: 60, height: 60, borderRadius: radius.md },
  itemImagePlaceholder: {
    width: 60, height: 60, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  itemName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: radius.full, marginTop: 3,
  },
  categoryText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  itemPrice: { fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 4 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteBtn: { padding: 4 },

  // Empty
  center: { paddingTop: 80, alignItems: 'center' },
  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.sm },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.full, marginTop: spacing.sm,
  },
  emptyAddBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  // Modal
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalClose: { padding: 4, marginRight: spacing.sm },
  modalTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  modalSaveBtn: {
    paddingHorizontal: spacing.md, paddingVertical: 7,
    borderRadius: radius.full,
  },
  modalSaveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  formSection: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: spacing.sm },
  modalInput: { marginBottom: spacing.sm },
  imagePreviewWrap: { borderRadius: radius.md, overflow: 'hidden', height: 160, marginTop: spacing.sm },
  imagePreview: { width: '100%', height: '100%' },
});
