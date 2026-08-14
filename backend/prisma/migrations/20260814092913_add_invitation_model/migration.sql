-- CreateTable
CREATE TABLE `Invitation` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER', 'GUEST') NOT NULL DEFAULT 'MEMBER',
    `invitedById` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invitation_tokenHash_key`(`tokenHash`),
    INDEX `Invitation_organizationId_email_idx`(`organizationId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
