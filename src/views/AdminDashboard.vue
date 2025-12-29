<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore, useAdminStore } from "../stores";
import api from "../api";
import type { MenuItem, User } from "../types";
import PageFrame from "../components/PageFrame.vue";
import Sidebar from "../components/Sidebar.vue";
import StatCardComponent from "../components/StatCard.vue";
import UserTable from "../components/UserTable.vue";
import FileTable from "../components/FileTable.vue";
import LogTable from "../components/LogTable.vue";
import StorageManagement from "../components/StorageManagement.vue";
import UserGroupManagement from "../components/UserGroupManagement.vue";
import BaseButton from "../components/BaseButton.vue";
import EmptyState from "../components/EmptyState.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import type { UserGroup } from "../types";
import BaseModal from "../components/BaseModal.vue";
import BaseInput from "../components/BaseInput.vue";
import ExtractModal from "../components/ExtractModal.vue";

const router = useRouter();
const authStore = useAuthStore();
const adminStore = useAdminStore();

const activeTab = ref("dashboard");
const isLoading = ref(false);
const showExtractModal = ref(false);

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "仪表盘", icon: "home" },
  { id: "storage", label: "存储管理", icon: "storage" },
  { id: "users", label: "用户管理", icon: "users" },
  { id: "groups", label: "用户组", icon: "groups" },
  { id: "files", label: "文件管理", icon: "files" },
  { id: "logs", label: "系统日志", icon: "logs" },
  { id: "extract", label: "提取文件", icon: "download" },
];

const handleTabChange = (tabId: string) => {
  if (tabId === "extract") {
    showExtractModal.value = true;
  } else {
    activeTab.value = tabId;
  }
};

const stats = computed(() => adminStore.stats);
const users = computed(() => adminStore.users);
const userGroups = computed(() => adminStore.userGroups);
const storageStats = computed(() => adminStore.storageStats);
const logs = computed(() => adminStore.logs);
const files = computed(() => adminStore.adminFiles);

interface GroupStorageAllocation {
  id: string;
  groupId: string;
  storageBackendId: string;
  quotaGb: number;
  backendName: string;
  backendType: string;
  backendEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

const pageTitle = computed(
  () =>
    menuItems.find((item) => item.id === activeTab.value)?.label || "管理面板",
);

const formatSize = (gb: number) => {
  if (gb >= 1024) {
    return (gb / 1024).toFixed(2) + " TB";
  }
  return gb.toFixed(2) + " GB";
};

const initAdminData = async () => {
  isLoading.value = true;
  try {
    await adminStore.initData();
    await adminStore.fetchAdminFiles();
  } catch (error) {
    // 初始化失败，静默处理
  } finally {
    isLoading.value = false;
  }
};

const showUserModal = ref(false);
const editingUser = ref<User | null>(null);
const userForm = ref({
  name: "",
  email: "",
  password: "",
  role: "user" as "admin" | "user",
  storageQuota: 50,
  groupId: "" as string | "",
});

const openCreateUser = () => {
  editingUser.value = null;
  userForm.value = {
    name: "",
    email: "",
    password: "",
    role: "user",
    storageQuota: 50,
    groupId: userGroups.value[0]?.id || "",
  };
  showUserModal.value = true;
};

const openEditUser = (user: User) => {
  editingUser.value = user;
  userForm.value = {
    name: user.name,
    email: user.email,
    password: "",
    role: user.role,
    storageQuota: user.storageQuota ?? 50,
    groupId: user.groupId || "",
  };
  showUserModal.value = true;
};

const submitUserForm = async () => {
  if (!userForm.value.name.trim() || !userForm.value.email.trim()) {
    alert("用户名和邮箱不能为空");
    return;
  }

  if (!editingUser.value) {
    if (!userForm.value.password || userForm.value.password.length < 6) {
      alert("密码长度至少为6位");
      return;
    }
  }

  isLoading.value = true;
  try {
    if (!editingUser.value) {
      const result = await adminStore.addUser({
        name: userForm.value.name.trim(),
        email: userForm.value.email.trim(),
        password: userForm.value.password,
        role: userForm.value.role,
        storageQuota: userForm.value.storageQuota,
        groupId: userForm.value.groupId || undefined,
      });
      if (!result.success) {
        alert(result.error || "添加用户失败");
      }
    } else {
      const updates: Partial<User> = {
        name: userForm.value.name.trim(),
        status: editingUser.value.status,
        storageQuota: userForm.value.storageQuota,
        groupId: userForm.value.groupId || undefined,
      };
      const result = await adminStore.updateUser(editingUser.value.id, updates);
      if (!result.success) {
        alert(result.error || "更新用户失败");
      }
    }
    showUserModal.value = false;
  } catch (error) {
    alert("保存用户失败，请稍后重试");
  } finally {
    isLoading.value = false;
  }
};

const editUser = async (user: User) => {
  openEditUser(user);
};

const deleteUser = async (user: User) => {
  if (!confirm(`确定要删除用户 "${user.name}" 吗？此操作不可恢复。`)) return;

  isLoading.value = true;
  try {
    const result = await adminStore.deleteUser(user.id);
    if (!result.success) {
      alert(result.error || "删除用户失败");
    }
  } catch (error) {
    alert("删除用户失败，请稍后重试");
  } finally {
    isLoading.value = false;
  }
};

const viewFile = (file: any) => {
  alert(
    `文件详情:\n\n文件名: ${file.name}\n上传者: ${file.uploader}\n大小: ${file.size}\n上传日期: ${file.uploaded}`,
  );
};

const deleteFile = async (file: any) => {
  if (confirm(`确定要删除文件 "${file.name}" 吗？此操作不可恢复。`)) {
    isLoading.value = true;
    // TODO: 可在此接入管理员强制删除文件的后端接口
    await new Promise((resolve) => setTimeout(resolve, 500));
    adminStore.addLog(
      "删除文件",
      "admin",
      "成功",
      "管理员强制删除（前端占位）",
      file.name,
    );
    isLoading.value = false;
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push("/");
};

const handleAddGroup = async (group: Omit<UserGroup, "id">) => {
  isLoading.value = true;
  try {
    const result = await adminStore.addGroup(group);
    if (!result.success) {
      alert(result.error || "添加用户组失败");
    }
  } catch (error) {
    alert("添加用户组失败，请稍后重试");
  } finally {
    isLoading.value = false;
  }
};

const handleEditGroup = async (id: string, updates: Partial<UserGroup>) => {
  isLoading.value = true;
  try {
    const result = await adminStore.updateGroup(id, updates);
    if (!result.success) {
      alert(result.error || "更新用户组失败");
    }
  } catch (error) {
    alert("更新用户组失败，请稍后重试");
  } finally {
    isLoading.value = false;
  }
};

const handleDeleteGroup = async (id: string) => {
  const group = adminStore.userGroups.find((g) => g.id === id);
  if (
    !group ||
    !confirm(`确定要删除用户组 "${group.name}" 吗？此操作不可恢复。`)
  )
    return;

  isLoading.value = true;
  try {
    const result = await adminStore.deleteGroup(id);
    if (!result.success) {
      alert(result.error || "删除用户组失败");
    }
  } catch (error) {
    alert("删除用户组失败，请稍后重试");
  } finally {
    isLoading.value = false;
  }
};

const showGroupStorageModal = ref(false);
const currentGroupId = ref<string | null>(null);
const groupStorageAllocations = ref<GroupStorageAllocation[]>([]);
const availableBackends = ref<any[]>([]);
const newAllocation = ref({
  storageBackendId: "",
  quotaGb: 10,
});

const loadGroupStorageAllocations = async (groupId: string) => {
  const [allocRes, backendRes] = await Promise.all([
    api.get(`/admin/groups/storage?groupId=${encodeURIComponent(groupId)}`),
    api.get("/admin/storage"),
  ]);
  if (allocRes.success && allocRes.data) {
    groupStorageAllocations.value = allocRes.data as GroupStorageAllocation[];
  } else {
    groupStorageAllocations.value = [];
  }
  if (backendRes.success && backendRes.data?.data) {
    availableBackends.value = backendRes.data.data;
  } else {
    availableBackends.value = [];
  }
  if (
    !newAllocation.value.storageBackendId &&
    availableBackends.value.length > 0
  ) {
    newAllocation.value.storageBackendId = availableBackends.value[0].id;
  }
};

const handleConfigureGroupStorage = async (groupId: string) => {
  currentGroupId.value = groupId;
  showGroupStorageModal.value = true;
  isLoading.value = true;
  try {
    await loadGroupStorageAllocations(groupId);
  } catch {
    alert("加载用户组存储分配失败");
  } finally {
    isLoading.value = false;
  }
};

const addGroupAllocation = async () => {
  if (
    !currentGroupId.value ||
    !newAllocation.value.storageBackendId ||
    newAllocation.value.quotaGb <= 0
  ) {
    alert("请填写完整的存储桶和配额信息");
    return;
  }
  isLoading.value = true;
  try {
    const res = await api.post("/admin/groups/storage", {
      groupId: currentGroupId.value,
      storageBackendId: newAllocation.value.storageBackendId,
      quotaGb: newAllocation.value.quotaGb,
    });
    if (!res.success) {
      alert(res.error || "创建存储分配失败");
    } else if (currentGroupId.value) {
      await loadGroupStorageAllocations(currentGroupId.value);
    }
  } catch {
    alert("创建存储分配失败，请稍后重试");
  } finally {
    isLoading.value = false;
  }
};

const updateGroupAllocation = async (allocation: GroupStorageAllocation) => {
  if (allocation.quotaGb <= 0) {
    alert("配额必须大于 0");
    return;
  }
  isLoading.value = true;
  try {
    const res = await api.put(`/admin/groups/storage/${allocation.id}`, {
      quotaGb: allocation.quotaGb,
    });
    if (!res.success) {
      alert(res.error || "更新存储分配失败");
    }
  } catch {
    alert("更新存储分配失败，请稍后重试");
  } finally {
    isLoading.value = false;
  }
};

const deleteGroupAllocation = async (allocation: GroupStorageAllocation) => {
  if (!confirm(`确定要删除存储桶 "${allocation.backendName}" 的分配吗？`))
    return;
  isLoading.value = true;
  try {
    const res = await api.delete(`/admin/groups/storage/${allocation.id}`);
    if (!res.success) {
      alert(res.error || "删除存储分配失败");
    } else if (currentGroupId.value) {
      await loadGroupStorageAllocations(currentGroupId.value);
    }
  } catch {
    alert("删除存储分配失败，请稍后重试");
  } finally {
    isLoading.value = false;
  }
};

const handleUpdateQuota = async (userId: string, quota: number) => {
  isLoading.value = true;
  try {
    const result = await adminStore.updateUserQuota(userId, quota);
    if (!result.success) {
      alert(result.error || "更新存储配额失败");
    }
  } catch (error) {
    alert("更新存储配额失败，请稍后重试");
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  authStore.initAuth();
  initAdminData();
});
</script>

<template>
  <PageFrame no-padding :allow-overflow="false" :full-screen="true">
    <div
      class="flex flex-col md:flex-row h-full w-full overflow-hidden relative"
    >
        <Sidebar
          :menu-items="menuItems"
          :active-tab="activeTab"
          username="管理员"
          user-role="超级权限"
          logo="S"
          logo-color="blue"
          @tab-change="handleTabChange"
          @logout="handleLogout"
        />

      <main
        class="flex-1 flex flex-col min-h-0 overflow-hidden relative h-full"
      >
        <header
          class="h-20 md:h-28 shrink-0 flex items-center justify-between px-6 md:px-12 gap-4 overflow-hidden relative z-10 border-b border-white/5 bg-surface-900/40 backdrop-blur-md"
        >
          <div class="flex flex-col min-w-0">
            <h1
              class="text-2xl md:text-3xl font-black text-white tracking-tighter truncate"
            >
              {{ pageTitle }}
            </h1>
            <p
              class="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] truncate"
            >
              Management System / {{ activeTab }}
            </p>
          </div>
          <BaseButton
            v-if="activeTab === 'users'"
            variant="primary"
            @click="openCreateUser"
            class="shadow-xl shadow-brand-primary/20"
          >
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M12 4v16m8-8H4"
              />
            </svg>
            添加用户
          </BaseButton>
        </header>

        <div
          class="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 relative z-0 bg-surface-950/20"
        >
          <div
            v-if="isLoading"
            class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center"
          >
            <LoadingSpinner size="lg" text="处理中..." />
          </div>

          <div class="min-h-full">
            <!-- 仪表盘视图 -->
            <div v-if="activeTab === 'dashboard'" class="space-y-8">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCardComponent
                  v-for="stat in stats"
                  :key="stat.title"
                  :stat="stat"
                />
              </div>
              <div
                class="bg-white/5 border border-white/5 rounded-2xl p-6 glass-card"
              >
                <h3 class="text-lg font-bold text-white mb-4">系统概览</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div
                    class="flex justify-between items-center border-b border-white/5 pb-2"
                  >
                    <span class="text-slate-400">总用户数</span>
                    <span class="text-white font-bold">{{ users.length }}</span>
                  </div>
                  <div
                    class="flex justify-between items-center border-b border-white/5 pb-2"
                  >
                    <span class="text-slate-400">活跃用户</span>
                    <span class="text-green-400 font-bold">{{
                      users.filter((u) => u.status === "活跃").length
                    }}</span>
                  </div>
                  <div
                    class="flex justify-between items-center border-b border-white/5 pb-2"
                  >
                    <span class="text-slate-400">用户组数</span>
                    <span class="text-white font-bold">{{
                      userGroups.length
                    }}</span>
                  </div>
                  <div
                    class="flex justify-between items-center border-b border-white/5 pb-2"
                  >
                    <span class="text-slate-400">总文件数</span>
                    <span class="text-white font-bold">{{
                      storageStats.totalFiles.toLocaleString()
                    }}</span>
                  </div>
                  <div
                    class="flex justify-between items-center border-b border-white/5 pb-2"
                  >
                    <span class="text-slate-400">可用存储</span>
                    <span class="text-green-400 font-bold">{{
                      formatSize(storageStats.availableStorage)
                    }}</span>
                  </div>
                  <div
                    class="flex justify-between items-center border-b border-white/5 pb-2"
                  >
                    <span class="text-slate-400">系统日志</span>
                    <span class="text-white font-bold"
                      >{{ logs.length }} 条</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- 存储管理视图 -->
            <div v-if="activeTab === 'storage'" class="h-full">
              <StorageManagement :stats="storageStats" @refresh="() => {}" />
            </div>

            <!-- 用户管理视图 -->
            <div v-if="activeTab === 'users'" class="h-full">
              <UserTable
                v-if="users.length > 0"
                :users="users"
                :groups="userGroups.map((g) => ({ id: g.id, name: g.name }))"
                @edit="editUser"
                @delete="deleteUser"
                @update-quota="handleUpdateQuota"
              />
              <EmptyState
                v-else
                icon="user"
                title="暂无用户"
                description="系统中还没有任何用户"
                action-label="添加用户"
                @action="openCreateUser"
              />
            </div>

            <!-- 用户组管理视图 -->
            <div v-if="activeTab === 'groups'" class="h-full">
              <UserGroupManagement
                :groups="userGroups"
                @add="handleAddGroup"
                @edit="handleEditGroup"
                @delete="handleDeleteGroup"
                @configure-storage="handleConfigureGroupStorage"
              />
            </div>

            <!-- 文件管理视图 -->
            <div v-if="activeTab === 'files'" class="h-full">
              <FileTable
                v-if="files.length > 0"
                :files="files"
                @view="viewFile"
                @delete="deleteFile"
              />
              <EmptyState
                v-else
                icon="file"
                title="暂无文件"
                description="系统中还没有任何文件"
              />
            </div>

            <!-- 系统日志视图 -->
            <div v-if="activeTab === 'logs'" class="h-full">
              <LogTable v-if="logs.length > 0" :logs="logs" />
              <EmptyState
                v-else
                icon="search"
                title="暂无日志"
                description="系统中还没有任何日志记录"
              />
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 添加/编辑用户模态框 -->
    <BaseModal
      :show="showUserModal"
      :title="editingUser ? '编辑用户' : '添加用户'"
      width="max-w-lg"
      @close="showUserModal = false"
    >
      <div class="space-y-4">
        <BaseInput
          v-model="userForm.name"
          label="用户名"
          placeholder="输入用户名"
          required
        />
        <BaseInput
          v-model="userForm.email"
          label="邮箱"
          placeholder="user@example.com"
          required
        />
        <BaseInput
          v-if="!editingUser"
          v-model="userForm.password"
          label="密码"
          type="password"
          placeholder="至少 6 位"
          required
        />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"
              >角色</label
            >
            <select
              v-model="userForm.role"
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div>
            <BaseInput
              v-model.number="userForm.storageQuota"
              type="number"
              label="存储配额 (GB)"
              :min="1"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2"
            >用户组</label
          >
          <select
            v-model="userForm.groupId"
            class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">未分组</option>
            <option
              v-for="group in userGroups"
              :key="group.id"
              :value="group.id"
            >
              {{ group.name }}
            </option>
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="glass" @click="showUserModal = false"
            >取消</BaseButton
          >
          <BaseButton variant="primary" @click="submitUserForm">
            保存
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- 用户组存储配置模态框 -->
    <BaseModal
      :show="showGroupStorageModal"
      title="配置用户组存储桶"
      width="max-w-3xl"
      @close="showGroupStorageModal = false"
    >
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <div class="text-sm text-slate-300">
            当前用户组：
            <span class="font-semibold">
              {{
                userGroups.find((g) => g.id === currentGroupId)?.name || "未知"
              }}
            </span>
          </div>
        </div>

        <div class="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <div class="text-sm text-slate-300 font-semibold mb-1">
            已分配的存储桶
          </div>
          <div
            v-if="groupStorageAllocations.length === 0"
            class="text-xs text-slate-500"
          >
            暂未为该用户组分配任何存储桶。
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="alloc in groupStorageAllocations"
              :key="alloc.id"
              class="flex items-center justify-between text-sm bg-slate-900/40 border border-white/10 rounded-lg px-3 py-2"
            >
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  <span class="text-white font-semibold">
                    {{ alloc.backendName }}
                  </span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-200"
                  >
                    {{ alloc.backendType }}
                  </span>
                  <span
                    v-if="!alloc.backendEnabled"
                    class="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300"
                  >
                    已禁用
                  </span>
                </div>
                <div class="text-xs text-slate-400">
                  ID: {{ alloc.storageBackendId }}
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1">
                  <span class="text-xs text-slate-400">配额(GB)</span>
                  <input
                    v-model.number="alloc.quotaGb"
                    type="number"
                    min="1"
                    class="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <BaseButton
                  variant="glass"
                  class="!py-1 !px-2 !text-xs"
                  @click="updateGroupAllocation(alloc)"
                >
                  保存
                </BaseButton>
                <BaseButton
                  variant="glass"
                  class="!py-1 !px-2 !text-xs text-red-400"
                  @click="deleteGroupAllocation(alloc)"
                >
                  删除
                </BaseButton>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <div class="text-sm text-slate-300 font-semibold mb-1">
            新增存储桶分配
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-300 mb-1"
                >选择存储后端</label
              >
              <select
                v-model="newAllocation.storageBackendId"
                class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>请选择存储后端</option>
                <option
                  v-for="backend in availableBackends"
                  :key="backend.id"
                  :value="backend.id"
                >
                  {{ backend.name }} ({{ backend.type }})
                </option>
              </select>
            </div>
            <div class="flex flex-col gap-2">
              <BaseInput
                v-model.number="newAllocation.quotaGb"
                type="number"
                label="配额 (GB)"
                :min="1"
              />
              <BaseButton
                variant="primary"
                class="w-full !py-1.5 !text-xs"
                @click="addGroupAllocation"
              >
                添加分配
              </BaseButton>
            </div>
          </div>
        </div>
       </div>
     </BaseModal>
 
     <ExtractModal
       :show="showExtractModal"
       @close="showExtractModal = false"
     />
   </PageFrame>
 </template>
