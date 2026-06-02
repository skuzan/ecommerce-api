# Address, Cart ve Coupon Modülleri

Bu doküman yeni eklenen Address, Cart/CartItem ve Coupon yapılarının projeye nasıl bağlandığını ve her katmanın ne yaptığını açıklamak için hazırlandı.

Build alınmadı. Prisma migration/generate işlemleri bu dokümanın konusu dışında, yalnızca kod yapısı anlatılıyor.

## Genel Mimari

Projede mevcut yapı şu sırayla ilerliyor:

1. `schemas`: Request body veya params doğrulaması.
2. `routes`: Endpoint tanımı, auth/role/validation middleware bağlantısı.
3. `controllers`: Request içinden parametreleri alır, service çağırır, response döner.
4. `services`: Asıl iş kuralları ve Prisma DB işlemleri.
5. `types/controllerTypes.ts`: Controller objelerinin hangi handler'ları içermesi gerektiğini tanımlar.
6. `routes/index.ts`: Ana route dosyası, modülleri API'ye bağlar.

Yeni modüller de bu yapıya uygun eklendi.

## Prisma Model Bağlantıları

Yeni modeller `prisma/schema.prisma` içinde tanımlandı:

- `Address`: Kullanıcı teslimat adresleri.
- `Cart`: Kullanıcının sepeti.
- `CartItem`: Sepetteki ürünler.
- `Coupon`: Sepete uygulanabilen kuponlar.
- `DiscountType`: Kupon tip enum'u. `PERCENTAGE` veya `FIXED`.

Eklenen ilişkiler:

- `User` -> `addresses Address[]`
- `User` -> `cart Cart?`
- `Product` -> `cartItems CartItem[]`
- `Cart` -> `items CartItem[]`
- `Cart` -> `coupon Coupon?`
- `Coupon` -> `carts Cart[]`

Not: `Cart.userId` alanı `@unique` olduğu için bir kullanıcının tek sepeti vardır. Bu yüzden `User` tarafında `cart Cart?` kullanıldı.

## Address Modülü

Adres dosyaları:

- `src/schemas/addressSchemas.ts`
- `src/services/addressService.ts`
- `src/controllers/addressController.ts`
- `src/routes/addressRoutes.ts`

Ana route bağlantısı:

```ts
router.use("/addresses", addressRoutes);
```

### Address Schema

`createAddressSchema` şu alanları doğrular:

- `title`
- `fullName`
- `phone`
- `city`
- `district`
- `fullAddress`
- `isDefault`

`isDefault` create işleminde varsayılan olarak `false` gelir.

`updateAddressSchema`, aynı alanların hepsini opsiyonel yapar. Böylece kullanıcı sadece değiştirmek istediği alanı gönderebilir.

### Address Service Davranışı

`findAll(userId)`

- Sadece giriş yapan kullanıcının adreslerini getirir.
- Soft delete yapılmış adresleri getirmez.
- Varsayılan adres en üstte olacak şekilde sıralar.

`findById(userId, id)`

- Adresin hem var olmasını hem de giriş yapan kullanıcıya ait olmasını kontrol eder.
- Başkasının adresine erişim engellenir.

`create(userId, input)`

- Yeni adres oluşturur.
- Eğer kullanıcının hiç adresi yoksa ilk adres otomatik default olur.
- Eğer `isDefault: true` gönderildiyse, kullanıcının önceki default adresleri `false` yapılır.
- Bu işlem transaction içinde yapılır.

`update(userId, id, input)`

- Sadece kullanıcının kendi adresini günceller.
- `isDefault: true` gönderilirse diğer default adresleri kapatır.

`remove(userId, id)`

- Hard delete yapmaz.
- `deletedAt` alanını doldurur.
- `isDefault` değerini `false` yapar.

`restore(userId, id)`

- Silinmiş adresi tekrar aktif yapar.
- Adres zaten aktifse conflict hatası döner.

`findDeleted(userId)`

- Kullanıcının soft delete yapılmış adreslerini listeler.

`setDefault(userId, id)`

- Seçilen adresi varsayılan adres yapar.
- Aynı kullanıcının diğer default adreslerini `false` yapar.

### Address Endpointleri

Tüm address endpointleri auth ister.

```http
GET /addresses
GET /addresses/deleted
POST /addresses
GET /addresses/:id
PUT /addresses/:id
DELETE /addresses/:id
PATCH /addresses/:id/restore
PATCH /addresses/:id/default
```

## Cart ve CartItem Modülü

Cart ve CartItem tek servis/controller/route içinde tutuldu.

Dosyalar:

- `src/schemas/cartSchemas.ts`
- `src/services/cartService.ts`
- `src/controllers/cartController.ts`
- `src/routes/cartRoutes.ts`

Ana route bağlantısı:

```ts
router.use("/cart", cartRoutes);
```

### Cart Schema

`addCartItemSchema`

- `productId`: UUID olmalı.
- `quantity`: Pozitif tam sayı olmalı. Varsayılan `1`.

`updateCartItemSchema`

- `quantity`: Pozitif tam sayı olmalı.

`applyCouponSchema`

- `code`: Kupon kodu.
- Trim edilir ve büyük harfe çevrilir.

`cartItemIdParamSchema`

- `itemId`: UUID olmalı.

### Cart Service Davranışı

Sepet yapısında kullanıcı başına tek cart mantığı kullanıldı.

`getOrCreateCart(userId)`

- Kullanıcının sepeti varsa getirir.
- Yoksa otomatik oluşturur.
- Bu işlem `prisma.cart.upsert` ile yapılır.

`get(userId)`

- Kullanıcının sepetini getirir.
- Sepet yoksa oluşturur.
- Ürün bilgilerini ve kuponu include eder.
- Response içine `summary` ekler.

`summary` şu alanlardan oluşur:

```ts
{
  subtotal: number;
  discountTotal: number;
  total: number;
}
```

`addItem(userId, input)`

- Önce ürünün var, aktif ve silinmemiş olduğunu kontrol eder.
- Stok kontrolü yapar.
- Ürün sepette varsa quantity artırır.
- Ürün sepette yoksa yeni CartItem oluşturur.
- `CartItem.price`, ürünün sepete eklenme anındaki fiyatıdır. Request'ten fiyat alınmaz.

`updateItem(userId, itemId, input)`

- Sadece kullanıcının kendi sepetindeki item güncellenir.
- Ürün silinmiş veya pasifse hata döner.
- Yeni quantity için stok kontrolü yapar.

`removeItem(userId, itemId)`

- Kullanıcının kendi sepetindeki item'ı siler.
- Sepet item bulunamazsa hata döner.

`clear(userId)`

- Sepetteki tüm item'ları siler.
- Sepete uygulanmış kupon varsa kaldırır.

`applyCoupon(userId, input)`

- Kupon kodunu bulur.
- Kupon aktif değilse hata döner.
- Süresi dolmuşsa hata döner.
- Sepet tutarı `minOrderAmount` altındaysa hata döner.
- `maxUsage` dolmuşsa hata döner.
- Uygunsa sepetin `couponId` alanına kupon bağlanır.

`removeCoupon(userId)`

- Sepetten kuponu kaldırır.

### İndirim Hesabı

İndirim hesabı `calculateDiscount` içinde yapılır.

`PERCENTAGE` için:

```ts
Math.floor((subtotal * discountValue) / 100)
```

`FIXED` için:

```ts
discountValue
```

İndirim hiçbir zaman sepet toplamını aşamaz. Bu yüzden `Math.min(subtotal, discount)` kullanılır.

### Cart Endpointleri

Tüm cart endpointleri auth ister.

```http
GET /cart
DELETE /cart
POST /cart/items
PUT /cart/items/:itemId
DELETE /cart/items/:itemId
POST /cart/coupon
DELETE /cart/coupon
```

## Coupon Modülü

Kupon dosyaları:

- `src/schemas/couponSchemas.ts`
- `src/services/couponService.ts`
- `src/controllers/couponController.ts`
- `src/routes/couponRoutes.ts`

Ana route bağlantısı:

```ts
router.use("/coupons", couponRoutes);
```

### Coupon Schema

`createCouponSchema` alanları:

- `code`
- `discountType`
- `discountValue`
- `minOrderAmount`
- `maxUsage`
- `expiresAt`
- `isActive`

`code` trim edilir ve büyük harfe çevrilir.

`discountType` iki değer alır:

- `PERCENTAGE`
- `FIXED`

`PERCENTAGE` kuponlarda `discountValue` 1-100 arasında olmalıdır.

`FIXED` kuponlarda `discountValue` kuruş cinsindendir.

`minOrderAmount` varsayılan olarak `0`.

`maxUsage` null ise sınırsız anlamına gelir.

`expiresAt` null ise süresiz anlamına gelir.

`isActive` varsayılan olarak `true`.

### Coupon Service Davranışı

`findAll()`

- Tüm kuponları getirir.
- `_count.carts` ile kaç sepete bağlı olduğunu da döner.

`findById(id)`

- Kuponu ID ile getirir.
- Bulunamazsa hata döner.

`create(input)`

- Kupon oluşturur.
- Aynı kupon kodu varsa conflict hatası döner.

`update(id, input)`

- Kuponu günceller.
- Aynı kod başka kuponda varsa conflict hatası döner.
- Güncelleme sonrası kupon tipi `PERCENTAGE` olacaksa `discountValue` 1-100 aralığında kalmalıdır.

`remove(id)`

- Hard delete yapmaz.
- `isActive` alanını `false` yapar.

`restore(id)`

- `isActive` alanını tekrar `true` yapar.
- Zaten aktifse conflict hatası döner.

`findDeleted()`

- `isActive: false` olan kuponları listeler.

### Coupon Endpointleri

Tüm coupon endpointleri auth ve admin yetkisi ister.

```http
GET /coupons
GET /coupons/deleted
POST /coupons
GET /coupons/:id
PUT /coupons/:id
DELETE /coupons/:id
PATCH /coupons/:id/restore
```

## Controller Types

`src/types/controllerTypes.ts` içine üç yeni controller tipi eklendi.

### AddressController

```ts
export interface AddressController extends CrudController {
  setDefault: RequestHandler;
}
```

Address standart CRUD handler'larına sahiptir. Ek olarak default adres seçmek için `setDefault` vardır.

### CartController

```ts
export interface CartController {
  get: RequestHandler;
  addItem: RequestHandler;
  updateItem: RequestHandler;
  removeItem: RequestHandler;
  clear: RequestHandler;
  applyCoupon: RequestHandler;
  removeCoupon: RequestHandler;
}
```

Cart standart CRUD değildir. Çünkü kullanıcı başına tek sepet vardır ve CartItem işlemleri aynı controller içinde yapılır.

### CouponController

```ts
export interface CouponController extends CrudController {}
```

Coupon standart CRUD yapısına uyduğu için doğrudan `CrudController` üzerinden tanımlandı.

## Migration Notu

Migration sırasında Prisma şu hatalı satırı üretebildi:

```sql
ALTER TABLE "products" ALTER COLUMN "searchVector" DROP DEFAULT;
```

Bu satır PostgreSQL generated column üzerinde çalışmaz. Çünkü `searchVector` daha önce generated column olarak oluşturulmuştu.

Bu nedenle yeni migration dosyasında bu satır kaldırıldı.

`DiscountType` enum'u migration yarıda kaldığında DB'de oluşmuş olabileceği için enum oluşturma SQL'i güvenli hale getirildi:

```sql
DO $$
BEGIN
    CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
```

Bu sayede enum daha önce oluşmuşsa migration tekrar patlamaz.

## Önemli İş Kuralları

- Kullanıcı sadece kendi adreslerini görebilir ve değiştirebilir.
- Kullanıcının ilk adresi otomatik default olur.
- Aynı kullanıcıda sadece bir default adres kalacak şekilde transaction kullanılır.
- Kullanıcı başına tek sepet vardır.
- Sepete ürün eklenirken fiyat request'ten alınmaz, ürünün DB'deki güncel fiyatı snapshot olarak `CartItem.price` alanına yazılır.
- Sepet item ekleme/güncelleme sırasında stok kontrolü yapılır.
- Kupon kodları büyük harfe çevrilir.
- Kupon silme işlemi hard delete değil, `isActive=false` işlemidir.
- Kupon indirimi sepet toplamını aşamaz.
- Coupon endpointleri sadece admin rolüne açıktır.

## Postman Kullanım Örnekleri

Bu bölüm Postman üzerinden yeni eklenen endpointleri test etmek için hazırlandı.

Örnek base URL:

```txt
http://localhost:3000/api
```

Projede API prefix farklıysa base URL'i kendi `app.ts` ayarına göre değiştir.

Auth gereken endpointlerde Header:

```txt
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

Coupon endpointleri için token'ın `ADMIN` rolüne sahip kullanıcıya ait olması gerekir.

### Address Postman İstekleri

Address işlemlerinin tamamı giriş yapmış kullanıcı ister.

#### Adres Oluşturma

```http
POST /addresses
```

Body:

```json
{
  "title": "Ev",
  "fullName": "Ahmet Yilmaz",
  "phone": "05551234567",
  "city": "Istanbul",
  "district": "Kadikoy",
  "fullAddress": "Caferaga Mahallesi, Moda Caddesi No: 10 Daire: 4",
  "isDefault": true
}
```

Notlar:

- Kullanıcının ilk adresiyse `isDefault` göndermesen bile default yapılır.
- `isDefault: true` gönderilirse önceki default adresler otomatik `false` olur.

#### Adresleri Listeleme

```http
GET /addresses
```

Body gerekmez.

#### Tek Adres Getirme

```http
GET /addresses/:id
```

Örnek:

```http
GET /addresses/ADDRESS_ID
```

#### Adres Güncelleme

```http
PUT /addresses/:id
```

Örnek body:

```json
{
  "title": "Is",
  "fullName": "Ahmet Yilmaz",
  "phone": "05551234567",
  "city": "Istanbul",
  "district": "Besiktas",
  "fullAddress": "Levent Mahallesi, Ornek Sokak No: 12",
  "isDefault": false
}
```

Kısmi güncelleme de yapılabilir:

```json
{
  "phone": "05557654321"
}
```

#### Adresi Silme

```http
DELETE /addresses/:id
```

Bu işlem hard delete değildir. `deletedAt` doldurulur.

#### Silinmiş Adresleri Listeleme

```http
GET /addresses/deleted
```

#### Silinmiş Adresi Geri Alma

```http
PATCH /addresses/:id/restore
```

#### Varsayılan Adres Yapma

```http
PATCH /addresses/:id/default
```

Body gerekmez.

### Cart ve CartItem Postman İstekleri

Cart işlemlerinin tamamı giriş yapmış kullanıcı ister.

Sepet kullanıcı başına tektir. `GET /cart` çağrıldığında kullanıcının sepeti yoksa otomatik oluşturulur.

#### Sepeti Getirme

```http
GET /cart
```

Body gerekmez.

Response içinde `summary` alanı gelir:

```json
{
  "subtotal": 25000,
  "discountTotal": 2500,
  "total": 22500
}
```

Tutarlar kuruş cinsindendir.

#### Sepete Ürün Ekleme

```http
POST /cart/items
```

Body:

```json
{
  "productId": "PRODUCT_ID",
  "quantity": 2
}
```

Notlar:

- `quantity` gönderilmezse varsayılan `1` olur.
- Ürün fiyatı body'den alınmaz.
- `CartItem.price`, ürün sepete eklendiği andaki DB fiyatıdır.
- Aynı ürün sepette varsa yeni item açılmaz, mevcut item quantity değeri artırılır.

#### Sepet Ürünü Güncelleme

```http
PUT /cart/items/:itemId
```

Body:

```json
{
  "quantity": 3
}
```

Notlar:

- `itemId`, `CartItem.id` değeridir.
- Quantity pozitif tam sayı olmalıdır.
- Stok yeterli değilse validation hatası döner.

#### Sepetten Ürün Silme

```http
DELETE /cart/items/:itemId
```

Body gerekmez.

#### Sepeti Temizleme

```http
DELETE /cart
```

Bu işlem:

- Sepetteki tüm item'ları siler.
- Sepete uygulanmış kuponu kaldırır.

#### Sepete Kupon Uygulama

```http
POST /cart/coupon
```

Body:

```json
{
  "code": "BAYRAM25"
}
```

Notlar:

- Kod otomatik büyük harfe çevrilir.
- Kupon pasifse, süresi dolmuşsa veya minimum sepet tutarı sağlanmamışsa hata döner.

#### Sepetten Kupon Kaldırma

```http
DELETE /cart/coupon
```

Body gerekmez.

### Coupon Postman İstekleri

Coupon endpointlerinin tamamı `ADMIN` rolü ister.

#### Kupon Oluşturma: Yüzdelik İndirim

```http
POST /coupons
```

Body:

```json
{
  "code": "BAYRAM25",
  "discountType": "PERCENTAGE",
  "discountValue": 25,
  "minOrderAmount": 50000,
  "maxUsage": 100,
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "isActive": true
}
```

Notlar:

- `discountValue` yüzdelik kuponlarda 1-100 arasında olmalıdır.
- `minOrderAmount` kuruş cinsindendir. Örnekte `50000` = 500 TL.
- `expiresAt` null olabilir.
- `maxUsage` null olabilir.

#### Kupon Oluşturma: Sabit Tutar İndirimi

```http
POST /coupons
```

Body:

```json
{
  "code": "KARGO50",
  "discountType": "FIXED",
  "discountValue": 5000,
  "minOrderAmount": 20000,
  "maxUsage": null,
  "expiresAt": null,
  "isActive": true
}
```

Notlar:

- `discountValue` kuruş cinsindendir. Örnekte `5000` = 50 TL.
- `maxUsage: null` sınırsız kullanım anlamına gelir.
- `expiresAt: null` süresiz kupon anlamına gelir.

#### Kuponları Listeleme

```http
GET /coupons
```

Body gerekmez.

#### Tek Kupon Getirme

```http
GET /coupons/:id
```

Örnek:

```http
GET /coupons/COUPON_ID
```

#### Kupon Güncelleme

```http
PUT /coupons/:id
```

Tam body örneği:

```json
{
  "code": "BAYRAM30",
  "discountType": "PERCENTAGE",
  "discountValue": 30,
  "minOrderAmount": 75000,
  "maxUsage": 50,
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "isActive": true
}
```

Kısmi güncelleme de yapılabilir:

```json
{
  "isActive": false
}
```

veya:

```json
{
  "discountValue": 20
}
```

Not: Kupon tipi `PERCENTAGE` ise güncelleme sonrası `discountValue` yine 1-100 aralığında kalmalıdır.

#### Kupon Silme

```http
DELETE /coupons/:id
```

Bu işlem hard delete değildir. `isActive` değerini `false` yapar.

#### Pasif Kuponları Listeleme

```http
GET /coupons/deleted
```

Buradaki `deleted`, kuponlar için `isActive: false` anlamına gelir.

#### Kuponu Geri Aktif Etme

```http
PATCH /coupons/:id/restore
```

Body gerekmez.

### Postman Test Sırası Önerisi

Address için:

1. Kullanıcı login ol ve token al.
2. `POST /addresses` ile adres oluştur.
3. `GET /addresses` ile listele.
4. `PATCH /addresses/:id/default` ile default yap.
5. `PUT /addresses/:id` ile güncelle.
6. `DELETE /addresses/:id` ile sil.
7. `GET /addresses/deleted` ile kontrol et.
8. `PATCH /addresses/:id/restore` ile geri al.

Cart için:

1. Kullanıcı login ol ve token al.
2. `GET /cart` ile sepeti oluştur/getir.
3. `POST /cart/items` ile ürün ekle.
4. `PUT /cart/items/:itemId` ile adet güncelle.
5. Admin token ile `POST /coupons` üzerinden kupon oluştur.
6. Kullanıcı token ile `POST /cart/coupon` üzerinden kupon uygula.
7. `DELETE /cart/coupon` ile kuponu kaldır.
8. `DELETE /cart/items/:itemId` ile ürün sil.
9. `DELETE /cart` ile sepeti temizle.

Coupon için:

1. Admin login ol ve token al.
2. `POST /coupons` ile kupon oluştur.
3. `GET /coupons` ile listele.
4. `GET /coupons/:id` ile detay gör.
5. `PUT /coupons/:id` ile güncelle.
6. `DELETE /coupons/:id` ile pasifleştir.
7. `GET /coupons/deleted` ile pasif kuponları kontrol et.
8. `PATCH /coupons/:id/restore` ile tekrar aktif et.
