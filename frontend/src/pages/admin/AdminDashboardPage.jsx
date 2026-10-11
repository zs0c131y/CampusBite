import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  ClipboardList,
  Settings,
  LogOut,
  ChefHat,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/shared/Brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const roles = {
  student: "Student",
  faculty: "Faculty",
  store_employee: "Store employee",
  admin: "Administrator",
};
const statuses = [
  "placed",
  "accepted",
  "processing",
  "ready",
  "picked_up",
  "cancelled",
];
const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);
const date = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
const readable = (value) => value?.replaceAll("_", " ") || "—";
const errorMessage = (error) =>
  error.response?.data?.errors?.map((item) => item.message).join(" ") ||
  error.response?.data?.message ||
  "Something went wrong. Please try again.";
const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "stores", label: "Stores", icon: Store },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "account", label: "Account", icon: Settings },
];
const selectClass =
  "h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function useAdminData(resource, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const query = JSON.stringify(params || {});
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(`/admin/${resource}`, {
          params: JSON.parse(query),
          signal: controller.signal,
        });
        setData(response.data.data);
      } catch (err) {
        if (!controller.signal.aborted) setError(errorMessage(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [resource, query, revision]);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  return { data, loading, error, reload };
}

function DataState({ loading, error, retry, children }) {
  if (loading)
    return (
      <div className="flex min-h-56 items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        Loading records…
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6"
      >
        <p>{error}</p>
        <Button variant="outline" className="mt-4" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  return children;
}

function Pagination({ data, page, setPage }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm text-muted-foreground">
      <span>
        {data.total} records · Page {page} of {Math.max(1, data.pages)}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= data.pages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function Table({ headers, children, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap px-5 py-3 font-medium"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {empty ? (
            <tr>
              <td
                colSpan={headers.length}
                className="p-12 text-center text-muted-foreground"
              >
                No records found.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

function Overview() {
  const { data, loading, error, reload } = useAdminData("overview");
  return (
    <DataState loading={loading} error={error} retry={reload}>
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total users", data.users, Users],
              ["Campus stores", data.stores, Store],
              ["Total orders", data.orders, ClipboardList],
              ["Collected payments", money(data.revenue), ShieldCheck],
            ].map((stat) => {
              const [label, value, StatIcon] = stat;
              return (
                <div
                  key={label}
                  className="rounded-2xl border bg-card p-6 shadow-sm"
                >
                  <div className="flex justify-between text-muted-foreground">
                    <span className="text-sm">{label}</span>
                    <StatIcon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight">
                    {value}
                  </p>
                  {label === "Collected payments" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Payments marked successful, all time
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-card p-6">
              <h2 className="text-lg font-semibold">Campus community</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Accounts by role
              </p>
              <div className="mt-6 space-y-5">
                {Object.entries(roles).map(([role, label]) => {
                  const count =
                    data.roles.find((item) => item._id === role)?.count || 0;
                  return (
                    <div key={role}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${data.users ? (count / data.users) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="rounded-2xl border bg-card p-6">
              <h2 className="text-lg font-semibold">Keep things moving</h2>
              <p className="mt-3 text-5xl font-semibold text-primary">
                {data.activeOrders}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Orders awaiting pickup or being prepared
              </p>
              <div className="mt-6 space-y-3">
                {navigation.slice(1, 4).map((item) => {
                  const { id, label } = item;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={id}
                      to={`/admin/${id}`}
                      className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-accent"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="flex-1">
                        Manage {label.toLowerCase()}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}
    </DataState>
  );
}

function UsersPanel() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [removing, setRemoving] = useState(false);
  const [saving, setSaving] = useState(false);
  const { data, loading, error, reload } = useAdminData("users", {
    search,
    role,
    page,
  });
  const edit = (user) =>
    setEditing({
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber || "",
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      clearRestriction: false,
    });
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { id, email: _email, ...body } = editing;
      await api.patch(`/admin/users/${id}`, body);
      toast.success("User updated");
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  const remove = async (event) => {
    event.preventDefault();
    if (!deleting || deleteConfirmation !== deleting.email || removing) return;
    setRemoving(true);
    try {
      await api.delete(`/admin/users/${deleting.id}`);
      toast.success("Account deleted");
      setDeleting(null);
      setDeleteConfirmation("");
      if (data.users.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setRemoving(false);
    }
  };
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search users"
            className="pl-10"
            placeholder="Search name, email or campus ID…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Filter users by role"
          className={selectClass}
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          {Object.entries(roles).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={reload} aria-label="Refresh users">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <DataState loading={loading} error={error} retry={reload}>
          {data && (
            <>
              <Table
                headers={["User", "Role", "Account", "Ordering", "Joined", ""]}
                empty={!data.users.length}
              >
                {data.users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/25">
                    <td className="px-5 py-4">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {user.registerNumber || user.employeeId}
                      </p>
                    </td>
                    <td className="px-5 py-4">{roles[user.role]}</td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={user.isActive ? "secondary" : "destructive"}
                      >
                        {user.isActive ? "Active" : "Suspended"}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {user.isEmailVerified ? "Email verified" : "Unverified"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="capitalize">
                        {user.trustTier || "good"}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {user.noShowCount || 0} no-shows
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                      {date(user.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      {user.role !== "admin" ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => edit(user)}
                          >
                            Manage
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label={`Delete account for ${user.name}`}
                            onClick={() => {
                              setDeleting(user);
                              setDeleteConfirmation("");
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Protected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
              <Pagination data={data} page={page} setPage={setPage} />
            </>
          )}
        </DataState>
      </div>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open && !saving) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage user</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Name</Label>
                <Input
                  id="user-name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={editing.name}
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-phone">Phone number</Label>
                <Input
                  id="user-phone"
                  value={editing.phoneNumber}
                  onChange={(event) =>
                    setEditing({ ...editing, phoneNumber: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">Role</Label>
                <select
                  id="user-role"
                  className={`${selectClass} w-full`}
                  value={editing.role}
                  disabled={editing.role === "store_employee"}
                  onChange={(event) =>
                    setEditing({ ...editing, role: event.target.value })
                  }
                >
                  {Object.entries(roles)
                    .filter(
                      ([value]) =>
                        value !== "admin" &&
                        (value !== "store_employee" ||
                          editing.role === "store_employee"),
                    )
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </select>
              </div>
              {[
                ["isActive", "Account active (uncheck to suspend)"],
                ["isEmailVerified", "Email verified"],
                [
                  "clearRestriction",
                  "Clear no-shows and ordering restrictions",
                ],
              ].map(([field, label]) => (
                <label key={field} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={editing[field]}
                    onChange={(event) =>
                      setEditing({ ...editing, [field]: event.target.checked })
                    }
                  />
                  {label}
                </label>
              ))}
              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
                <Button disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !removing) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account for {deleting?.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the account and signs the user out. Order
              history is kept. Any owned stores will be paused. Accounts with
              active orders cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={remove} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Type {deleting?.email} to confirm
              </Label>
              <Input
                id="delete-confirmation"
                autoComplete="off"
                value={deleteConfirmation}
                disabled={removing}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={removing}
                onClick={() => setDeleting(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={removing || deleteConfirmation !== deleting?.email}
              >
                {removing ? "Deleting…" : "Delete account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StoresPanel() {
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState(null);
  const [saving, setSaving] = useState(false);
  const { data, loading, error, reload } = useAdminData("stores", { page });
  const toggle = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/stores/${pending.id}`, {
        isActive: !pending.isActive,
      });
      toast.success("Store updated");
      setPending(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={reload}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <DataState loading={loading} error={error} retry={reload}>
          {data && (
            <>
              <Table
                headers={["Store", "Owner", "UPI ID", "Availability", ""]}
                empty={!data.stores.length}
              >
                {data.stores.map((store) => (
                  <tr key={store.id}>
                    <td className="px-5 py-4 font-medium">{store.name}</td>
                    <td className="px-5 py-4">
                      {store.owner_name || "Unknown"}
                      <p className="text-xs text-muted-foreground">
                        {store.owner_email}
                      </p>
                    </td>
                    <td className="px-5 py-4">{store.upi_id}</td>
                    <td className="px-5 py-4">
                      <Badge variant={store.isActive ? "secondary" : "outline"}>
                        {store.isActive ? "Active" : "Paused"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPending(store)}
                      >
                        {store.isActive ? "Pause store" : "Activate store"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
              <Pagination data={data} page={page} setPage={setPage} />
            </>
          )}
        </DataState>
      </div>
      <Dialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open && !saving) setPending(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending?.isActive ? "Pause" : "Activate"} {pending?.name}?
            </DialogTitle>
            <DialogDescription>
              {pending?.isActive
                ? "The store will be hidden from customers and cannot receive new orders. Existing orders remain available to its owner."
                : "The store will appear to customers and can receive orders again."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setPending(null)}
            >
              Cancel
            </Button>
            <Button onClick={toggle} disabled={saving}>
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OrdersPanel() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [selected, setSelected] = useState(null);
  const { data, loading, error, reload } = useAdminData("orders", {
    page,
    search,
    status,
    payment,
  });
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          aria-label="Search order number"
          className="min-w-48 flex-1"
          placeholder="Search order number…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Order status"
          className={selectClass}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {readable(value)}
            </option>
          ))}
        </select>
        <select
          aria-label="Payment status"
          className={selectClass}
          value={payment}
          onChange={(event) => {
            setPayment(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All payments</option>
          {["pending", "success", "failed"].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={reload} aria-label="Refresh orders">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <DataState loading={loading} error={error} retry={reload}>
          {data && (
            <>
              <Table
                headers={[
                  "Order",
                  "Customer",
                  "Store",
                  "Amount",
                  "Status",
                  "Payment",
                  "",
                ]}
                empty={!data.orders.length}
              >
                {data.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium">
                      {order.orderNumber}
                      <p className="text-xs font-normal text-muted-foreground">
                        {date(order.createdAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {order.customer?.name || "Unknown"}
                      <p className="text-xs text-muted-foreground">
                        {order.customer?.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {order.store?.name || "Unknown"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {money(order.totalAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className="capitalize whitespace-nowrap"
                      >
                        {readable(order.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          order.paymentStatus === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(order)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
              <Pagination data={data} page={page} setPage={setPage} />
            </>
          )}
        </DataState>
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {selected?.orderNumber}</DialogTitle>
            <DialogDescription>
              {selected?.customer?.name} · {selected?.store?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y">
            {selected?.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span>{money(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-4 font-semibold">
            <span>Total</span>
            <span>{money(selected?.totalAmount)}</span>
          </div>
          <p className="text-sm capitalize text-muted-foreground">
            {readable(selected?.status)} · Payment: {selected?.paymentStatus}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AccountPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    currentPassword: "",
    newPassword: "",
  });
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async (event) => {
    event.preventDefault();
    if (form.newPassword !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await api.put("/admin/account", form);
      await logout();
      toast.success("Account updated. Sign in with your updated credentials.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <form
      onSubmit={save}
      className="max-w-xl space-y-5 rounded-2xl border bg-card p-6"
    >
      <div>
        <h2 className="font-semibold">Your admin account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Change your login details here. Saving signs you out.
        </p>
      </div>
      {[
        ["name", "Name", "text"],
        ["email", "Email / login", "text"],
        ["currentPassword", "Current password", "password"],
        ["newPassword", "New password (optional)", "password"],
      ].map(([field, label, type]) => (
        <div className="space-y-2" key={field}>
          <Label htmlFor={field}>{label}</Label>
          <Input
            id={field}
            type={type}
            required={field !== "newPassword"}
            autoComplete={
              field === "currentPassword"
                ? "current-password"
                : field === "newPassword"
                  ? "new-password"
                  : field
            }
            value={form[field]}
            onChange={(event) =>
              setForm({ ...form, [field]: event.target.value })
            }
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        New passwords need at least 8 characters, uppercase and lowercase
        letters, and a number.
      </p>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </div>
      <Button disabled={saving}>
        {saving ? "Saving…" : "Save account details"}
      </Button>
    </form>
  );
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const section =
    navigation.find((item) => `/admin/${item.id}` === location.pathname)?.id ||
    "overview";
  const current = navigation.find((item) => item.id === section);
  const panels = {
    overview: Overview,
    users: UsersPanel,
    stores: StoresPanel,
    orders: OrdersPanel,
    account: AccountPanel,
  };
  const Panel = panels[section];
  const descriptions = {
    overview: "A clear view of your campus, all in one place.",
    users: "Manage campus accounts, verification and ordering access.",
    stores: "Review store owners and control outlet availability.",
    orders: "Track orders and payments across every campus store.",
    account: "Keep your administrator profile and login details up to date.",
  };
  return (
    <div className="min-h-screen lg:flex">
      <aside className="admin-rail border-b bg-foreground text-background lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-5 lg:block">
          <Brand to="/admin/overview" />
          <Badge variant="secondary" className="lg:mt-4">
            Admin console
          </Badge>
        </div>
        <nav
          aria-label="Admin navigation"
          className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:py-5"
        >
          {navigation.map((item) => {
            const { id, label } = item;
            const Icon = item.icon;
            return (
              <NavLink
                key={id}
                to={`/admin/${id}`}
                className={({ isActive }) =>
                  `sidebar-link whitespace-nowrap ${isActive || (id === "overview" && location.pathname === "/admin") ? "active" : ""}`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            );
          })}
        </nav>
        <div className="hidden border-t p-5 lg:block">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="mt-1 truncate text-xs text-background/60">
            {user.email}
          </p>
          <Button
            variant="ghost"
            className="mt-4 w-full justify-start"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 p-4 sm:p-8 lg:p-10">
        <header className="page-heading flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              Campus administration
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {current.label}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {descriptions[section]}
            </p>
          </div>
          <Button
            variant="outline"
            className="lg:hidden"
            aria-label="Sign out"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <Panel key={section} />
      </div>
    </div>
  );
}
